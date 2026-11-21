/**
 * sync-series: reads the official series websites and fills the app.
 *
 * For each row of `series_sources`:
 *  - adapter 'sro' (GT World Challenge Asia, Japan Cup, IGTC): finds the series event
 *    that matches each of our events by date, then
 *      · replaces the official timetable (sessions with from_series = true),
 *      · lists new documents from the event page and the noticeboard (series_updates),
 *        and sends an alert to the team for each new bulletin during a race week,
 *      · during and after the weekend, copies our team's results (team_results).
 *  - adapter 'links' (any other page, e.g. a results page with PDFs): lists new PDF links.
 *
 * Deploy: supabase functions deploy sync-series
 * Run every 15 minutes with pg_cron (see README).
 */
import { createClient } from 'npm:@supabase/supabase-js@2';

import {
  isLoginPage,
  parseCalendar,
  parseEventPage,
  parseNoticeboard,
  parseResultsIndex,
  parseSeasons,
  parseSessionResults,
  parseTeamDocuments,
  parseTeamHome,
  teamRows,
  type SroDocument,
} from './sro.ts';
import { cleanName, fileTitle, matchEventFolder, parseMediaFolder } from './pcca.ts';

const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

const DAY = 86_400_000;
const today = () => new Date().toISOString().slice(0, 10);
const daysBetween = (a: string, b: string) => Math.abs(Date.parse(a) - Date.parse(b)) / DAY;

async function get(url: string): Promise<string> {
  const res = await fetch(url, { headers: { 'user-agent': 'AbsoluteRacingApp/1.0 (team app; series sync)' } });
  if (!res.ok) throw new Error(`${res.status} for ${url}`);
  return await res.text();
}

type Source = {
  id: string;
  championship_id: string;
  adapter: 'sro' | 'pcca' | 'links';
  kind: string;
  label: string;
  url: string;
  team_name: string;
  /** Prefix of the secrets holding the teams-area login, e.g. SRO_ASIA -> SRO_ASIA_USERNAME / SRO_ASIA_PASSWORD. */
  login_secret: string | null;
};
type AppEvent = { id: string; name: string; start_date: string; end_date: string };

/** Saves documents not seen before. Returns the new ones. */
async function saveUpdates(
  rows: { championship_id: string; event_id?: string | null; kind: string; section?: string; title: string; url: string; team_only?: boolean }[],
) {
  if (!rows.length) return [];
  const { data, error } = await supabase
    .from('series_updates')
    .upsert(rows, { onConflict: 'url', ignoreDuplicates: true })
    .select('title, section, url, event_id');
  if (error) throw error;
  return data ?? [];
}

async function syncSro(src: Source) {
  const base = new URL(src.url).origin;
  const { data: events } = await supabase
    .from('events')
    .select('id, name, start_date, end_date')
    .eq('championship_id', src.championship_id)
    .gte('end_date', new Date(Date.now() - 14 * DAY).toISOString().slice(0, 10))
    .lte('start_date', new Date(Date.now() + 180 * DAY).toISOString().slice(0, 10));
  if (!events?.length) return 'no events in the next 6 months';

  const seasons = parseSeasons(await get(`${base}/calendar`));
  const years: string[] = [...new Set((events as AppEvent[]).map((e) => e.start_date.slice(0, 4)))];
  const { data: cars } = await supabase.from('cars').select('id, number');
  let found = 0;

  for (const year of years) {
    const seasonId = seasons[year];
    const calendar = await get(seasonId ? `${base}/calendar?filter_season_id=${seasonId}` : `${base}/calendar`);
    for (const path of parseCalendar(calendar)) {
      const pageUrl = base + path;
      const page = parseEventPage(await get(pageUrl), pageUrl);
      if (!page.startDate) continue;
      const event = (events as AppEvent[]).find((e) => daysBetween(e.start_date, page.startDate!) <= 3);
      if (!event) continue;
      found++;

      await supabase.from('events').update({ series_url: pageUrl }).eq('id', event.id);

      // Official timetable: replace what the last sync wrote, leave the team's own sessions alone.
      if (page.sessions.length) {
        await supabase.from('sessions').delete().eq('event_id', event.id).eq('from_series', true);
        await supabase.from('sessions').insert(
          page.sessions.map((s) => ({ event_id: event.id, title: s.title, starts_at: s.startsAt, ends_at: s.endsAt, from_series: true })),
        );
      }

      // Documents and bulletins.
      const docs = [...page.documents];
      if (page.noticeboardPath) docs.push(...parseNoticeboard(await get(base + page.noticeboardPath), base + page.noticeboardPath));
      const fresh = await saveUpdates(
        docs.map((d) => ({ championship_id: src.championship_id, event_id: event.id, kind: 'bulletins', section: d.section, title: d.title, url: d.url })),
      );
      const raceWeek = daysBetween(event.start_date, today()) <= 7 || (today() >= event.start_date && today() <= event.end_date);
      if (raceWeek && fresh.length) {
        await supabase.from('alerts').insert(
          fresh.slice(0, 5).map((d: { title: string; section: string }) => ({
            title: `New ${d.section || 'document'}: ${d.title}`,
            body: `${event.name} – open it from the event page.`,
            sent_by: null,
            target_type: 'all',
          })),
        );
      }

      // Results, from the first day of the event until two weeks after.
      if (today() >= event.start_date && page.resultsPath) {
        for (const session of parseResultsIndex(await get(base + page.resultsPath))) {
          const ours = teamRows(parseSessionResults(await get(base + session.path)), src.team_name);
          for (const row of ours) {
            const car = cars?.find((c: { number: string }) => c.number.replace('#', '').trim() === row.carNumber);
            if (!car) continue; // add the car (with its number) in the app to receive its results
            await supabase.from('team_results').upsert(
              {
                event_id: event.id,
                session: session.title,
                car_id: car.id,
                position: row.position,
                class_position: row.classPosition,
                class_name: [row.className, row.category].filter(Boolean).join(' '),
                from_series: true,
              },
              { onConflict: 'event_id,session,car_id' },
            );
          }
        }
      }
    }
  }
  return `${found} events matched`;
}

async function syncLinks(src: Source) {
  const html = await get(src.url);
  const links = [...html.matchAll(/<a[^>]*href="([^"]+\.pdf[^"]*)"[^>]*>([\s\S]*?)<\/a>/gi)].map((m) => ({
    url: new URL(m[1], src.url).toString(),
    title: m[2].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim() || decodeURIComponent(m[1].split('/').pop() ?? 'Document'),
  }));
  const fresh = await saveUpdates(links.map((l) => ({ championship_id: src.championship_id, kind: src.kind, section: src.label, title: l.title, url: l.url })));
  return `${fresh.length} new documents`;
}

/* ---------- Porsche Carrera Cup Asia media centre (public folder tree) ---------- */

async function syncPcca(src: Source) {
  const base = new URL(src.url).origin; // https://www.carreracupasia.com
  const list = async (path: string) => parseMediaFolder(await get(`${base}/media_area?path=${encodeURIComponent(path)}`));

  const { data: events } = await supabase
    .from('events')
    .select('id, name, location, summary, start_date, end_date')
    .eq('championship_id', src.championship_id)
    .gte('end_date', new Date(Date.now() - 14 * DAY).toISOString().slice(0, 10))
    .lte('start_date', new Date(Date.now() + 60 * DAY).toISOString().slice(0, 10));
  const years = new Set([today().slice(0, 4), ...(events ?? []).map((e: AppEvent) => e.start_date.slice(0, 4))]);

  type Found = { event: (AppEvent & { location: string; summary: string }) | null; section: string; title: string; url: string };
  const found: Found[] = [];
  /** Files in a folder and its subfolders (max 2 levels), all under one section name. */
  const crawl = async (path: string, section: string, event: Found['event'], depth = 0) => {
    const { folders, files } = await list(path);
    files.forEach((f) => found.push({ event, section, title: fileTitle(f.name), url: f.url }));
    if (depth < 2) for (const f of folders) await crawl(f.path, depth === 0 && event ? cleanName(f.name) : section, event, depth + 1);
  };

  for (const year of years) {
    for (const top of (await list(`Document/${year}/`)).folders) {
      if (/notice board/i.test(top.name)) {
        // One folder per event: only the events around now.
        for (const folder of (await list(top.path + '/')).folders) {
          const event = matchEventFolder(folder.name, (events ?? []) as (AppEvent & { location: string; summary: string })[]);
          if (event) await crawl(folder.path + '/', 'Notice board', event);
        }
      } else {
        await crawl(top.path + '/', cleanName(top.name), null);
      }
    }
  }

  const fresh = await saveUpdates(
    found.map((f) => ({ championship_id: src.championship_id, event_id: f.event?.id ?? null, kind: 'bulletins', section: f.section, title: f.title, url: f.url })),
  );
  // Alert the team about new notice-board documents during race week.
  const alerts = fresh
    .map((u: { url: string }) => found.find((f) => f.url === u.url)!)
    .filter((f: Found) => f?.event && daysBetween(f.event.start_date, today()) <= 7)
    .slice(0, 5)
    .map((f: Found) => ({ title: `New ${f.section}: ${f.title}`, body: `${f.event!.name} – Carrera Cup Asia notice board.`, sent_by: null, target_type: 'all' }));
  if (alerts.length) await supabase.from('alerts').insert(alerts);
  return `${fresh.length} new documents`;
}

/* ---------- Teams area: private documents, copied into the app's document center ---------- */

const CATEGORY: Record<string, string> = { bulletin: 'bulletin', timetable: 'timetable', 'results pdf': 'other', 'entry list': 'other' };

/** Signs in to the teams area and returns the session cookie. */
async function teamLogin(base: string, prefix: string): Promise<string> {
  const username = Deno.env.get(`${prefix}_USERNAME`);
  const password = Deno.env.get(`${prefix}_PASSWORD`);
  if (!username || !password) throw new Error(`secrets ${prefix}_USERNAME / ${prefix}_PASSWORD are not set`);
  const ua = 'AbsoluteRacingApp/1.0 (team app; series sync)';
  const jar = new Map<string, string>();
  const keep = (res: Response) => res.headers.getSetCookie().forEach((c) => {
    const [pair] = c.split(';');
    const i = pair.indexOf('=');
    jar.set(pair.slice(0, i).trim(), pair.slice(i + 1));
  });
  // Open the form first so the site's session cookie exists, then post the login with it.
  keep(await fetch(`${base}/teams-login`, { headers: { 'user-agent': ua } }));
  const cookieHeader = () => [...jar].map(([k, v]) => `${k}=${v}`).join('; ');
  keep(
    await fetch(`${base}/teams-login`, {
      method: 'POST',
      redirect: 'manual',
      headers: { 'content-type': 'application/x-www-form-urlencoded', 'user-agent': ua, cookie: cookieHeader() },
      body: new URLSearchParams({ username, password, login: 'Submit' }),
    }),
  );
  const cookie = cookieHeader();
  if (!cookie) throw new Error('teams login returned no session');
  return cookie;
}

async function getAs(url: string, cookie: string) {
  const res = await fetch(url, { headers: { cookie, 'user-agent': 'AbsoluteRacingApp/1.0 (team app; series sync)' } });
  if (!res.ok) throw new Error(`${res.status} for ${url}`);
  return res;
}

/** Downloads a teams-area file into storage and lists it in the team's documents (team only, read receipts). */
async function importTeamDocument(doc: SroDocument, cookie: string, championshipId: string, eventId: string | null, meeting: string) {
  const res = await getAs(doc.url, cookie);
  const type = res.headers.get('content-type') ?? 'application/octet-stream';
  if (type.includes('text/html')) throw new Error('teams session expired while downloading');
  const name = decodeURIComponent(doc.url.split('/').pop() ?? 'document').replace(/[^\w.\- ]+/g, '_');
  const path = `series/${championshipId}/${meeting}/${doc.url.match(/\/team\/(\d+)\//)?.[1] ?? Date.now()}-${name}`;
  const { error: upErr } = await supabase.storage.from('documents').upload(path, await res.arrayBuffer(), { contentType: type, upsert: true });
  if (upErr) throw upErr;
  await supabase.from('documents').insert({
    title: doc.title,
    category: CATEGORY[doc.section.toLowerCase()] ?? 'other',
    event_id: eventId,
    storage_path: path,
    target_type: 'all',
  });
}

async function syncSroTeam(src: Source) {
  if (!src.login_secret) return 'no teams login';
  const base = new URL(src.url).origin;
  const cookie = await teamLogin(base, src.login_secret);

  const pages: { path: string; eventId: string | null; meeting: string; defaultSection?: string }[] = [];
  // Season documents (regulations, tyres, fuel, logistics…).
  const home = await (await getAs(`${base}/teams-login-home`, cookie)).text();
  if (isLoginPage(home)) throw new Error('teams login failed: check the username and password secrets');
  for (const type of parseTeamHome(home)) pages.push({ path: type.path, eventId: null, meeting: 'season', defaultSection: type.title });

  // Event documents for our events of the last 2 weeks and next 2 months (meeting id comes from the public sync).
  const { data: events } = await supabase
    .from('events')
    .select('id, series_url, start_date')
    .eq('championship_id', src.championship_id)
    .not('series_url', 'is', null)
    .gte('end_date', new Date(Date.now() - 14 * DAY).toISOString().slice(0, 10))
    .lte('start_date', new Date(Date.now() + 60 * DAY).toISOString().slice(0, 10));
  for (const e of events ?? []) {
    const meeting = e.series_url.match(/\/event\/(\d+)\//)?.[1];
    if (meeting) pages.push({ path: `/teams-login-meeting?filter_meeting_id=${meeting}`, eventId: e.id, meeting });
  }

  let added = 0;
  for (const page of pages) {
    const html = await (await getAs(base + page.path, cookie)).text();
    const docs = parseTeamDocuments(html, base + page.path, page.defaultSection).filter((d) => d.section !== 'Results CSV');
    const fresh = await saveUpdates(
      docs.map((d) => ({ championship_id: src.championship_id, event_id: page.eventId, kind: 'team', section: d.section, title: d.title, url: d.url, team_only: true })),
    );
    for (const f of fresh) {
      const doc = docs.find((d) => d.url === f.url)!;
      await importTeamDocument(doc, cookie, src.championship_id, page.eventId, page.meeting);
      added++;
    }
  }
  return `${added} team documents added`;
}

Deno.serve(async () => {
  const { data: sources, error } = await supabase.from('series_sources').select('*');
  if (error) return new Response(error.message, { status: 500 });
  const report: Record<string, string> = {};
  for (const src of sources as Source[]) {
    try {
      report[src.label] = src.adapter === 'sro' ? await syncSro(src) : src.adapter === 'pcca' ? await syncPcca(src) : await syncLinks(src);
      if (src.adapter === 'sro' && src.login_secret) report[`${src.label} (teams area)`] = await syncSroTeam(src);
      await supabase.from('series_sources').update({ last_synced_at: new Date().toISOString(), last_error: null }).eq('id', src.id);
    } catch (e) {
      report[src.label] = `error: ${(e as Error).message}`;
      await supabase.from('series_sources').update({ last_error: (e as Error).message }).eq('id', src.id);
    }
  }
  return Response.json(report);
});
