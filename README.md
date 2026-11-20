# Absolute Racing Team app

One app for iOS, Android and desktop (web) for the team, drivers and sponsors.
Built with Expo (React Native + TypeScript) and Supabase.

## Who sees what

| | Management | Drivers | Sponsors |
|---|---|---|---|
| News and event calendar | ✓ | ✓ | ✓ |
| Live timing, results, videos, onboard links | ✓ | ✓ | ✓ |
| Event schedule | ✓ | ✓ (plus own car's sessions) | ✓ |
| Today dashboard (countdown, weather, today's schedule) | ✓ | ✓ | |
| Documents (briefings, run plans, bulletins…) | all | ones aimed at them or their car | |
| Alerts | send + see all | ones aimed at them or their car | |
| Read receipts | ✓ | | |
| Crew roster and travel plans | ✓ | ✓ | |
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

## Layout

- `src/app/(tabs)/` – Today (sponsors: Home), Events, Documents, Messages, More
- `src/app/document/[id].tsx`, `alerts.tsx`, `notify.tsx` – document viewer with read receipts, alert inbox, send-an-alert
- `src/app/event/[id].tsx` – event page (links, schedule, crew, documents, travel)
- `src/app/chat/[channelId].tsx` – chat
- `src/data/queries.ts` – all data access (swap demo data for Supabase here)
- `supabase/schema.sql` – tables and role-based access rules

## Still to do

- Sign-in screen and Supabase-backed queries
- Management editing screens (events, travel, crew, documents, news, guide)
- Push notifications for alerts, documents and messages
- Full travel itinerary (flights, trains, rental cars, hotels, restaurants)
- Multiple languages
- Official logo, icon and team colours (currently placeholders)
