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

Crew can preview the app as a driver or a sponsor from the More tab.

## Supabase

The app is connected to the team's Supabase project (`src/lib/supabase.ts`; the publishable key is
safe in the app because row-level security decides what each person can see). Setting it up:

1. In Supabase, open **SQL Editor**, paste `supabase/schema.sql` and run it (once).
2. Paste `supabase/seed.sql` and run it: series, placeholder cars #1 and #2, chat channels, guide
   headings and the 2027 calendar. Safe to run again after `node scripts/build-seed.mjs`.
3. **Authentication → Emails**: in the *Magic Link* and *Confirm signup* templates, show the code
   `{{ .Token }}`. People sign in by typing that 6-digit code; there are no passwords.
4. Sign in to the app with your own email first: the first person to sign in becomes crew.

Everyone else who signs in is a sponsor until crew adds them: put their email, role and car in the
`invites` table before they sign in, or change `role` in `profiles` afterwards. Visitors who do not
sign in see the public content (calendar, news, results).

If the tables are not there yet, the app shows the demo data in `src/data/demo.ts`
(`EXPO_PUBLIC_DEMO=1` forces it). All data access goes through `src/data/queries.ts`, which reads
the store that `src/data/remote.ts` fills from the database.

## Languages

English, French, Simplified Chinese, Japanese, Thai and Malay. The app follows the phone's language and can be changed under More. Translations live in `src/i18n/` (one file per language, same keys as `en.ts`). Content the team writes (event names, documents, news) is shown as written.

## Layout

- `src/app/(tabs)/` – Today (sponsors: Home), Season, Documents, Messages, More
- `src/app/document/[id].tsx`, `alerts.tsx`, `notify.tsx` – document viewer with read receipts, alert inbox, send-an-alert
- `src/app/event/[id].tsx` – event page (links, schedule, crew, documents, travel)
- `src/app/chat/[channelId].tsx` – chat
- `src/data/queries.ts` – all data access; `src/data/remote.ts` loads it from Supabase
- `supabase/schema.sql` – tables and role-based access rules; `supabase/seed.sql` – starting data

## Still to do

- Crew editing screens (events, travel, crew, documents, news, guide)
- Push notifications for alerts, documents and messages
- App icon and splash screen artwork from the logo

## Season calendar

`src/data/calendar.ts` is generated from the team calendar spreadsheet (one colour per series):

```
python3 scripts/import-calendar.py Absolute_Racing_2027_Calendar.xlsx 2027
```

Then `node scripts/build-seed.mjs` and run the new `supabase/seed.sql` in the Supabase SQL Editor.

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
- **Carrera Cup Asia** (adapter `pcca`): reads the public media centre (carreracupasia.com/media_area),
  season folders (regulations, technical bulletins, results, points) and the notice board of each
  event (bulletins, entry list, stewards decisions, results), and alerts the team during race week.
- **Other pages** (adapter `links`, e.g. timingresult.com for China GT and Carrera Cup Asia):
  lists new PDF links found on the page.

Pages are configured in the `series_sources` table. Deploy and run every 15 minutes:

```
supabase functions deploy sync-series
select cron.schedule('sync-series', '*/15 * * * *', $$
  select net.http_post(url := 'https://<project>.supabase.co/functions/v1/sync-series',
                       headers := '{"Authorization": "Bearer <service role key>"}'::jsonb) $$);
```

### Teams area (private SRO documents)

With the team login, the sync also reads the SRO teams area (season documents, and per event:
entry list, information / forms, bulletins, timetables, results PDF). Each new file is copied into
the `documents` storage bucket and listed in the app's Documents for the team, with read receipts.
Sponsors never see them.

Set the login as Supabase secrets (never in the code), then set `login_secret = 'SRO_ASIA'` on the
GT World Challenge Asia row of `series_sources`:

```
supabase secrets set SRO_ASIA_USERNAME=... SRO_ASIA_PASSWORD=...
```
