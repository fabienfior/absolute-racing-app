# Absolute Racing Team app

One app for iOS, Android and desktop (web) for the team, drivers and sponsors.
Built with Expo (React Native + TypeScript) and Supabase.

## Who sees what

| | Management | Drivers | Sponsors |
|---|---|---|---|
| News and event calendar | ✓ | ✓ | ✓ |
| Results, videos, onboard links | ✓ | ✓ | ✓ |
| Event timetable | ✓ | ✓ | ✓ |
| Travel plans | ✓ | ✓ | |
| Team guide | ✓ | ✓ | |
| Messaging | ✓ | ✓ | |
| Create and edit content | ✓ | | |

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

- `src/app/(tabs)/` – Home, Events, Messages, Team guide, Profile
- `src/app/event/[id].tsx` – event page (links, timetable, travel)
- `src/app/chat/[channelId].tsx` – chat
- `src/data/queries.ts` – all data access (swap demo data for Supabase here)
- `supabase/schema.sql` – tables and role-based access rules

## Still to do

- Sign-in screen and Supabase-backed queries
- Management editing screens (events, travel, news, guide)
- Push notifications for news and messages
- Official logo, icon and team colours (currently placeholders)
