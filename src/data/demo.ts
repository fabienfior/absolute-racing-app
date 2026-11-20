import type { Channel, GuideSection, Message, NewsPost, RaceEvent } from '@/lib/types';

/** Placeholder content so the app can be tried before Supabase is connected. */

export const events: RaceEvent[] = [
  {
    id: 'round-1',
    name: 'Round 1 – Season Opener',
    circuit: 'Sepang International Circuit',
    location: 'Kuala Lumpur, Malaysia',
    startDate: '2027-03-12',
    endDate: '2027-03-14',
    summary: 'First round of the season. Two races plus qualifying.',
    timetable: [
      { day: 'Fri', time: '09:00', title: 'Team briefing in the garage' },
      { day: 'Fri', time: '11:30', title: 'Free practice 1' },
      { day: 'Fri', time: '15:00', title: 'Free practice 2' },
      { day: 'Sat', time: '10:15', title: 'Qualifying' },
      { day: 'Sat', time: '14:30', title: 'Race 1' },
      { day: 'Sun', time: '13:00', title: 'Race 2' },
    ],
    travel: [
      { kind: 'flight', title: 'Outbound flight', details: 'Flight details to be confirmed', when: 'Wed 10 Mar' },
      { kind: 'hotel', title: 'Team hotel', details: 'Hotel name and address', when: '10–15 Mar' },
      { kind: 'transfer', title: 'Shuttle to circuit', details: 'Departs hotel lobby daily', when: '07:00' },
    ],
    links: [],
  },
  {
    id: 'round-2',
    name: 'Round 2',
    circuit: 'Chang International Circuit',
    location: 'Buriram, Thailand',
    startDate: '2027-04-09',
    endDate: '2027-04-11',
    summary: 'Second round. Travel plan coming soon.',
    timetable: [],
    travel: [],
    links: [],
  },
  {
    id: 'test-2026',
    name: 'Pre-season test',
    circuit: 'Sepang International Circuit',
    location: 'Kuala Lumpur, Malaysia',
    startDate: '2026-11-05',
    endDate: '2026-11-06',
    summary: 'Two days of testing with both drivers.',
    timetable: [{ day: 'Thu', time: '09:00', title: 'Testing session' }],
    travel: [],
    links: [
      { label: 'Lap times', url: 'https://example.com/results', kind: 'results' },
      { label: 'Highlights video', url: 'https://www.youtube.com', kind: 'video' },
      { label: 'Onboard lap', url: 'https://www.youtube.com', kind: 'onboard' },
    ],
  },
];

export const news: NewsPost[] = [
  {
    id: 'n1',
    title: 'Season calendar confirmed',
    body: 'The full calendar for next season is now in the app. Tap Events to see every round.',
    publishedAt: '2026-11-18T09:00:00Z',
    audience: 'everyone',
  },
  {
    id: 'n2',
    title: 'Testing wrap-up',
    body: 'Two productive days of testing. Highlights and onboard footage are on the event page.',
    publishedAt: '2026-11-07T17:00:00Z',
    eventId: 'test-2026',
    audience: 'everyone',
  },
  {
    id: 'n3',
    title: 'Round 1 travel booked',
    body: 'Flights and hotel for Round 1 are confirmed. Check the travel section of the event.',
    publishedAt: '2026-11-15T12:00:00Z',
    eventId: 'round-1',
    audience: 'team',
  },
];

export const guide: GuideSection[] = [
  { id: 'g1', title: 'Contacts', body: 'Team manager, logistics lead and emergency numbers go here.' },
  { id: 'g2', title: 'Race weekend routine', body: 'Arrival times, garage rules, briefings and debriefs.' },
  { id: 'g3', title: 'Kit and dress code', body: 'Team kit for travel, paddock and podium.' },
  { id: 'g4', title: 'Media and social', body: 'What can be posted, when, and the tags to use.' },
];

export const channels: Channel[] = [
  { id: 'all-team', name: 'Whole team', roles: ['management', 'driver'] },
  { id: 'drivers', name: 'Drivers', roles: ['management', 'driver'] },
  { id: 'management', name: 'Management', roles: ['management'] },
];

export const messages: Message[] = [
  { id: 'm1', channelId: 'all-team', author: 'Team Manager', body: 'Welcome to the team app!', sentAt: '2026-11-19T08:00:00Z' },
  { id: 'm2', channelId: 'drivers', author: 'Team Manager', body: 'Debrief at 18:00 after testing.', sentAt: '2026-11-05T15:00:00Z' },
];
