/**
 * Parsers for the SRO Motorsports websites (GT World Challenge Asia, Japan Cup,
 * Intercontinental GT Challenge). Their pages are rendered on the server, so plain
 * HTML is enough: no API key and no browser needed.
 *
 *   /calendar?filter_season_id=N   list of /event/{id}/{slug} links per season
 *   /event/{id}/{slug}             dates, timetable, PDF links (timetable, entry list)
 *   /noticeboard?meeting_id={id}   official documents (bulletins, decisions, regulations)
 *   /results/{year}/{slug}/{sess}  classification table per session
 *
 * Pure functions only (no fetch), so they can be tested with saved pages.
 */

export type SroSession = { title: string; startsAt: string; endsAt: string };
export type SroDocument = { section: string; title: string; url: string };
export type SroEvent = {
  meetingId: string;
  title: string;
  startDate?: string;
  endDate?: string;
  sessions: SroSession[];
  documents: SroDocument[]; // PDFs linked from the event page
  noticeboardPath?: string;
  resultsPath?: string;
};
export type SroResultRow = {
  position: number;
  carNumber: string;
  className: string;
  category: string;
  team: string;
  drivers: string;
  car: string;
  laps: number;
};

const decode = (s: string) =>
  s
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&#0?39;|&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const absolute = (base: string, href: string) => new URL(href.replace(/ /g, '%20'), base).toString();

/** Season ids from the season dropdown, e.g. { 2027: '11', 2026: '10' }. */
export function parseSeasons(html: string): Record<string, string> {
  const out: Record<string, string> = {};
  const select = html.match(/<select[^>]*name="filter_season_id"[\s\S]*?<\/select>/);
  for (const m of (select?.[0] ?? '').matchAll(/<option[^>]*value="(\d+)"[^>]*>\s*(\d{4})\s*</g)) out[m[2]] = m[1];
  return out;
}

/** Event page paths on a calendar page, in order. */
export function parseCalendar(html: string): string[] {
  return [...new Set([...html.matchAll(/href="(\/event\/\d+\/[^"]+)"/g)].map((m) => m[1]))];
}

const MONTHS = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];

/** "Saturday, 31 October" + start date of the event -> "2026-10-31" */
function captionToDate(caption: string, startDate: string): string | undefined {
  const m = caption.toLowerCase().match(/(\d{1,2})\s+([a-z]+)/);
  if (!m) return;
  const month = MONTHS.indexOf(m[2]);
  if (month < 0) return;
  let year = Number(startDate.slice(0, 4));
  if (month < Number(startDate.slice(5, 7)) - 1 - 6) year += 1; // event across new year
  return `${year}-${String(month + 1).padStart(2, '0')}-${m[1].padStart(2, '0')}`;
}

/** Local date + local time + GMT time -> UTC ISO string (handles the GMT day being different). */
export function toUtc(localDate: string, local: string, gmt: string): string {
  const mins = (t: string) => Number(t.slice(0, 2)) * 60 + Number(t.slice(3, 5));
  let offset = mins(local) - mins(gmt); // local = gmt + offset
  if (offset > 14 * 60) offset -= 24 * 60;
  if (offset < -12 * 60) offset += 24 * 60;
  const localMs = Date.parse(`${localDate}T${local}:00Z`);
  return new Date(localMs - offset * 60_000).toISOString();
}

export function parseEventPage(html: string, pageUrl: string, defaultMinutes = 60): SroEvent {
  const meetingId = pageUrl.match(/\/event\/(\d+)\//)?.[1] ?? '';
  const startDate = html.match(/"startDate"\s*:\s*"(\d{4}-\d{2}-\d{2})/)?.[1];
  const endDate = html.match(/"endDate"\s*:\s*"(\d{4}-\d{2}-\d{2})/)?.[1];
  const title = decode(html.match(/<title>([\s\S]*?)<\/title>/)?.[1] ?? '').split('|')[0].trim();

  const sessions: SroSession[] = [];
  for (const table of html.matchAll(/<table class="timetable__table">([\s\S]*?)<\/table>/g)) {
    const caption = decode(table[1].match(/<caption[\s\S]*?<\/caption>/)?.[0] ?? '');
    const day = startDate ? captionToDate(caption, startDate) : undefined;
    if (!day) continue;
    for (const row of table[1].matchAll(/<tr>\s*<td>([\s\S]*?)<\/td>\s*<td>\s*(\d{2}:\d{2})\s*<\/td>\s*<td>\s*(\d{2}:\d{2})\s*<\/td>/g)) {
      const startsAt = toUtc(day, row[2], row[3]);
      sessions.push({
        title: decode(row[1]),
        startsAt,
        endsAt: new Date(Date.parse(startsAt) + defaultMinutes * 60_000).toISOString(),
      });
    }
  }

  const documents: SroDocument[] = [];
  for (const m of html.matchAll(/<a[^>]*href="([^"]+\.pdf)"[^>]*>[\s\S]*?link-button__title">([^<]+)</g)) {
    const url = absolute(pageUrl, m[1]);
    if (!documents.some((d) => d.url === url)) documents.push({ section: 'Event', title: decode(m[2]), url });
  }

  return {
    meetingId,
    title,
    startDate,
    endDate,
    sessions,
    documents,
    noticeboardPath: html.match(/href="(\/noticeboard\?meeting_id=\d+)"/)?.[1],
    resultsPath: html.match(/href="(\/results\?filter_season_id=\d+&(?:amp;)?filter_meeting_id=\d+)"/)?.[1]?.replace('&amp;', '&'),
  };
}

/** Official documents on the noticeboard, grouped by their heading (e.g. "Event Bulletin"). */
export function parseNoticeboard(html: string, pageUrl: string): SroDocument[] {
  const docs: SroDocument[] = [];
  for (const box of html.matchAll(/link-boxes__heading[^>]*>([\s\S]*?)<\/h2>([\s\S]*?)<\/ul>/g)) {
    const section = decode(box[1]);
    for (const a of box[2].matchAll(/<a[^>]*href="([^"]+)"[^>]*>[\s\S]*?link-boxes__title">([\s\S]*?)<\/span>/g)) {
      docs.push({ section, title: decode(a[2]), url: absolute(pageUrl, a[1]) });
    }
  }
  return docs;
}

/** Session result pages for one meeting, e.g. [{ title: 'Race 1', path: '/results/2026/x/race-1' }]. */
export function parseResultsIndex(html: string): { title: string; path: string }[] {
  const out: { title: string; path: string }[] = [];
  for (const m of html.matchAll(/href="(\/results\/\d{4}\/[^"/]+\/[^"#?]+)"[^>]*>([^<]+)</g)) {
    if (!out.some((o) => o.path === m[1])) out.push({ path: m[1], title: decode(m[2]) });
  }
  return out;
}

/** Rows of a session classification table. */
export function parseSessionResults(html: string): SroResultRow[] {
  const table = html.match(/<table class="table session">([\s\S]*?)<\/table>/)?.[1] ?? '';
  const head = [...(table.match(/<thead[\s\S]*?<\/thead>/)?.[0] ?? '').matchAll(/<th[^>]*>([\s\S]*?)<\/th>/g)].map((m) =>
    decode(m[1]).toLowerCase(),
  );
  const col = (name: string) => head.indexOf(name);
  const rows: SroResultRow[] = [];
  for (const tr of (table.match(/<tbody[\s\S]*?<\/tbody>/)?.[0] ?? table).matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/g)) {
    const cells = [...tr[1].matchAll(/<td[^>]*>([\s\S]*?)<\/td>/g)].map((m) => decode(m[1]));
    if (cells.length < 5) continue;
    const position = Number(cells[col('pos')]);
    if (!Number.isFinite(position) || position <= 0) continue;
    rows.push({
      position,
      carNumber: cells[col('car #')] ?? '',
      className: cells[col('class')] ?? '',
      category: cells[col('cat')] ?? '',
      team: cells[col('team')] ?? '',
      drivers: cells[col('drivers')] ?? '',
      car: cells[col('car')] ?? '',
      laps: Number(cells[col('laps')] ?? 0),
    });
  }
  return rows;
}

/** Our rows of a session, with the position inside their class and category. */
export function teamRows(rows: SroResultRow[], teamName: string) {
  const team = teamName.toLowerCase();
  return rows
    .filter((r) => r.team.toLowerCase().includes(team))
    .map((r) => ({
      ...r,
      classPosition: rows.filter((o) => o.className === r.className && o.category === r.category && o.position <= r.position).length,
    }));
}
