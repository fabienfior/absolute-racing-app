# Absolute Racing Team app

One app for iOS, Android and desktop (web) for the team, drivers and sponsors.
Built with Expo (React Native + TypeScript) and Supabase.

## Who sees what

| | Management | Drivers | Sponsors |
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
Use the Profile tab to preview it as management, a driver or a sponsor.

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
- Management editing screens (events, travel, crew, documents, news, guide)
- Push notifications for alerts, documents and messages
- App icon and splash screen artwork from the logo
