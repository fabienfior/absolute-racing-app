# Absolute Racing Team app

One app for iOS, Android and desktop (web) for the team, drivers and sponsors.
Built with Expo (React Native + TypeScript) and Supabase.

## Who sees what

| | Crew | Drivers | Sponsors |
|---|---|---|---|
| News and season calendar (filter by championship) | ✓ | ✓ | ✓ |
| Our results, championship standings, track weather forecast | ✓ | ✓ | ✓ |
| Live timing, results, videos, onboard links | ✓ | ✓ | ✓ |
| Event schedule | ✓ | ✓ (plus own car's sessions) | ✓ |
| Today dashboard (countdown, weather, today's schedule) | ✓ | ✓ | |
| Documents (briefings, run plans, bulletins…) | all | ones aimed at them or their car | |
| Alerts | send + see all | ones aimed at them or their car | |
| Read receipts | ✓ | | |
| Crew roster | ✓ | ✓ | |
| Travel (flights, trains, rental cars, shuttles, hotels, restaurants) | everyone's | their own | |
| Team guide and messaging | ✓ | ✓ | |
| Crew phone numbers | ✓ | | |

Documents and alerts can target the whole team, one role, or one car.

## Run it

```bash
npm install
npm run web        # desktop / browser
npm run ios        # or scan the QR code with Expo Go
npm run android
```

The app runs on demo data (`src/data/demo.ts`) until Supabase is connected.
Use the Profile tab to preview it as crew, a driver or a sponsor.

## Connect Supabase

1. Create a project at supabase.com.
2. Run `supabase/schema.sql` in the SQL editor.
3. Copy `.env.example` to `.env` and fill in the URL and anon key.

## Languages

English, French, Simplified Chinese, Japanese, Thai and Malay. The app follows the phone's language and can be changed under More. Translations live in `src/i18n/` (one file per language, same keys as `en.ts`). Content the team writes (event names, documents, news) is shown as written.

## Layout

- `src/app/(tabs)/` – Today (sponsors: Home), Season, Documents, Messages, More
- `src/app/document/[id].tsx`, `alerts.tsx`, `notify.tsx` – document viewer with read receipts, alert inbox, send-an-alert
- `src/app/event/[id].tsx` – event page (links, schedule, crew, documents, travel)
- `src/app/chat/[channelId].tsx` – chat
- `src/data/queries.ts` – all data access (swap demo data for Supabase here)
- `supabase/schema.sql` – tables and role-based access rules

## Still to do

- Sign-in screen and Supabase-backed queries
- Crew editing screens (events, travel, crew, documents, news, guide)
- Push notifications for alerts, documents and messages
- App icon and splash screen artwork from the logo

## Season calendar

`src/data/calendar.ts` is generated from the team calendar spreadsheet (one colour per series):

```
python3 scripts/import-calendar.py Absolute_Racing_2027_Calendar.xlsx 2027
```

New venues go in the `VENUES` table at the top of the script.

## Onboard folders

Crew creates a folder per event and car with a link to a shared Google Drive / Dropbox / OneDrive
folder, and can add direct links to single videos. Drivers see their car's folders and whole-team
folders. Tables: `onboard_folders`, `onboard_videos`.

## Series sync (official timetables, bulletins, results)

`supabase/functions/sync-series` reads the official websites on the server:

- **SRO sites** (GT World Challenge Asia, Japan Cup, IGTC; adapter `sro`): matches each of our events
  by date, copies the official timetable into the event schedule, lists every new document from
  the event page and noticeboard (bulletins, decisions, entry lists) and alerts the team during race
  week, and copies our team's results from each session (cars are matched by number).
- **Other pages** (adapter `links`, e.g. timingresult.com for China GT and Carrera Cup Asia):
  lists new PDF links found on the page.

Pages are configured in the `series_sources` table. Deploy and run every 15 minutes:

```
supabase functions deploy sync-series
select cron.schedule('sync-series', '*/15 * * * *', $$
  select net.http_post(url := 'https://<project>.supabase.co/functions/v1/sync-series',
                       headers := '{"Authorization": "Bearer <service role key>"}'::jsonb) $$);
```
