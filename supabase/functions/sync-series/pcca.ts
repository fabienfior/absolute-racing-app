/**
 * Parser for the Porsche Carrera Cup Asia media centre (carreracupasia.com/media_area).
 * It is a public folder tree rendered on the server:
 *
 *   ?path=Document/2026/                                   01 Regulation, 02 Technical Bulletin, 03 Results,
 *                                                          04 Championship Points, 05 Digital Notice Board, …
 *   ?path=Document/2026/05 Digital Notice Board/           one folder per event, e.g. "06 Rounds 12 and 13 Singapore"
 *   ?path=…/06 Rounds 12 and 13 Singapore/                 01 Competitors Information … 08 Stewards Decision
 *   leaf folders list files with direct links on media.carreracupasia.com (no login).
 */

export type MediaFolder = { name: string; path: string };
export type MediaFile = { id: string; name: string; url: string };

const decode = (s: string) =>
  s.replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&#0?39;/g, "'").replace(/&quot;/g, '"').replace(/\s+/g, ' ').trim();

export function parseMediaFolder(html: string): { folders: MediaFolder[]; files: MediaFile[] } {
  const folders: MediaFolder[] = [];
  for (const m of html.matchAll(/<a href="\?path=([^"]+)">\s*<div class="forder">\s*<h4 class="forder-name">([\s\S]*?)<\/h4>/g)) {
    folders.push({ path: decode(m[1]), name: decode(m[2]) });
  }
  const files: MediaFile[] = [];
  for (const m of html.matchAll(/<div class="file" data-id="(\d+)">([\s\S]*?)<\/div>\s*<\/div>/g)) {
    const name = decode(m[2].match(/file-name">([\s\S]*?)<\/h6>/)?.[1] ?? '');
    const href = m[2].match(/<a href="([^"]+)"/)?.[1];
    if (href) files.push({ id: m[1], name, url: encodeURI(decode(href)) });
  }
  return { folders, files };
}

/** "06 Rounds 12 and 13 Singapore" -> "Rounds 12 and 13 Singapore"; "04 Bulletins and SRs" -> "Bulletins and SRs". */
export const cleanName = (name: string) => name.replace(/^\d+\s+/, '').replace(/\s+POSTED$/i, '').trim();

/** A file name without its extension, for display. */
export const fileTitle = (name: string) => name.replace(/\.[a-z0-9]+$/i, '').replace(/[_]+/g, ' ').trim();

/**
 * Picks the app event that a notice-board folder belongs to:
 * same venue, then the most round numbers in common ("Rounds 9, 10 and 11 Sepang"),
 * and "Official Test Days" goes to the event whose summary mentions a test.
 */
export function matchEventFolder<E extends { id: string; name: string; location: string; summary: string }>(
  folderName: string,
  events: E[],
): E | undefined {
  const folder = folderName.toLowerCase();
  const rounds = new Set((folder.match(/\d+/g) ?? []).slice(1)); // first number is the folder order
  const isTest = /test/.test(folder);
  let best: { e: E; score: number } | undefined;
  for (const e of events) {
    const venues = [e.name.split('–').pop() ?? '', e.location.split(',')[0]].map((v) => v.trim().toLowerCase()).filter(Boolean);
    if (!venues.some((v) => folder.includes(v))) continue;
    const eventRounds = (e.summary.match(/\d+/g) ?? []).filter((n) => rounds.has(n)).length;
    const score = eventRounds * 2 + (isTest === /test/i.test(e.summary) ? 1 : 0);
    if (!best || score > best.score) best = { e, score };
  }
  return best?.e;
}
