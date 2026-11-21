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

import { parseCalendar, parseEventPage, parseNoticeboard, parseResultsIndex, parseSeasons, parseSessionResults, teamRows } from './sro.ts';

const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

const DAY = 86_400_000;
const today = () => new Date().toISOString().slice(0, 10);
const daysBetween = (a: string, b: string) => Math.abs(Date.parse(a) - Date.parse(b)) / DAY;

async function get(url: string): Promise<string> {
  const res = await fetch(url, { headers: { 'user-agent': 'AbsoluteRacingApp/1.0 (team app; series sync)' } });
  if (!res.ok) throw new Error(`${res.status} for ${url}`);
  return await res.text();
}

type Source = { id: string; championship_id: string; adapter: 'sro' | 'links'; kind: string; label: string; url: string; team_name: string };
type AppEvent = { id: string; name: string; start_date: string; end_date: string };

/** Saves documents not seen before. Returns the new ones. */
async function saveUpdates(rows: { championship_id: string; event_id?: string; kind: string; section?: string; title: string; url: string }[]) {
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

Deno.serve(async () => {
  const { data: sources, error } = await supabase.from('series_sources').select('*');
  if (error) return new Response(error.message, { status: 500 });
  const report: Record<string, string> = {};
  for (const src of sources as Source[]) {
    try {
      report[src.label] = src.adapter === 'sro' ? await syncSro(src) : await syncLinks(src);
      await supabase.from('series_sources').update({ last_synced_at: new Date().toISOString(), last_error: null }).eq('id', src.id);
    } catch (e) {
      report[src.label] = `error: ${(e as Error).message}`;
      await supabase.from('series_sources').update({ last_error: (e as Error).message }).eq('id', src.id);
    }
  }
  return Response.json(report);
});
