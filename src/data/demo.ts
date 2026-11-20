import type {
  Alert,
  Car,
  Championship,
  Channel,
  GuideSection,
  Member,
  Message,
  NewsPost,
  RaceEvent,
  TeamDocument,
} from '@/lib/types';

/**
 * Placeholder content so the app can be tried before Supabase is connected.
 * Dates are relative to today so the dashboard always has a "live" weekend.
 */
const DAY = 86_400_000;
const today0 = new Date();
today0.setHours(0, 0, 0, 0);
const at = (dayOffset: number, h: number, m = 0) =>
  new Date(today0.getTime() + dayOffset * DAY + (h * 60 + m) * 60_000).toISOString();
const date = (dayOffset: number) => {
  const d = new Date(today0.getTime() + dayOffset * DAY);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

export const championships: Championship[] = [
  { id: 'gtwca', name: 'GT World Challenge Asia', short: 'GTWC Asia' },
  { id: 'pcca', name: 'Porsche Carrera Cup Asia', short: 'Carrera Cup Asia' },
  { id: 'igtc', name: 'Intercontinental GT Challenge', short: 'IGTC' },
  { id: 'fiagtwc', name: 'FIA GT World Cup', short: 'FIA GT World Cup' },
  { id: 'chinagt', name: 'China GT', short: 'China GT' },
  { id: 'endurance', name: 'Asian endurance (Sepang 12h, Shanghai 8h)', short: 'Endurance' },
];

export const cars: Car[] = [
  { id: 'car-a', number: '#1', model: 'GT3 car', championshipId: 'gtwca' },
  { id: 'car-b', number: '#2', model: 'Porsche 911 GT3 Cup', championshipId: 'pcca' },
];

export const members: Member[] = [
  { id: 'u-tm', name: 'Alex Team Manager', role: 'management', jobTitle: 'Team manager', phone: '+00 000 000 001' },
  { id: 'u-co', name: 'Sam Coordinator', role: 'management', jobTitle: 'Team coordinator', phone: '+00 000 000 002' },
  { id: 'u-eng1', name: 'Chris Engineer', role: 'management', jobTitle: 'Race engineer', carId: 'car-a' },
  { id: 'u-d1', name: 'Driver One', role: 'driver', jobTitle: 'Driver', carId: 'car-a', phone: '+00 000 000 011' },
  { id: 'u-d2', name: 'Driver Two', role: 'driver', jobTitle: 'Driver', carId: 'car-a', phone: '+00 000 000 012' },
  { id: 'u-d3', name: 'Driver Three', role: 'driver', jobTitle: 'Driver', carId: 'car-b', phone: '+00 000 000 013' },
  { id: 'u-sp', name: 'Sponsor Guest', role: 'sponsor', jobTitle: 'Partner' },
];

export const events: RaceEvent[] = [
  {
    id: 'sepang-12h',
    name: 'Sepang 12 Hours',
    championshipId: 'endurance',
    circuit: 'Sepang International Circuit',
    location: 'Kuala Lumpur, Malaysia',
    latitude: 2.7608,
    longitude: 101.7382,
    startDate: date(-1),
    endDate: date(1),
    summary: 'Twelve-hour endurance race with both cars entered.',
    sessions: [
      { id: 's1', startsAt: at(-1, 9), endsAt: at(-1, 10), title: 'Team briefing' },
      { id: 's2', startsAt: at(-1, 14), endsAt: at(-1, 15, 30), title: 'Free practice' },
      { id: 's3', startsAt: at(0, 8, 30), endsAt: at(0, 9), title: 'Engineering briefing', carId: 'car-a' },
      { id: 's4', startsAt: at(0, 10), endsAt: at(0, 11), title: 'Qualifying' },
      { id: 's5', startsAt: at(0, 15), endsAt: at(0, 15, 45), title: 'Autograph session (media)' },
      { id: 's6', startsAt: at(0, 19), endsAt: at(0, 20), title: 'Night practice' },
      { id: 's7', startsAt: at(1, 10), endsAt: at(1, 22), title: 'Race – 12 hours' },
    ],
    travel: [
      { id: 't1', kind: 'flight', direction: 'outbound', title: 'Flight XX 101', from: 'Hong Kong (HKG)', to: 'Kuala Lumpur (KUL)', startsAt: at(-3, 9, 10), endsAt: at(-3, 12, 55), reference: 'Booking ABC123', memberIds: ['u-tm', 'u-co', 'u-eng1', 'u-d1'] },
      { id: 't2', kind: 'flight', direction: 'outbound', title: 'Flight XX 202', from: 'Shanghai (PVG)', to: 'Kuala Lumpur (KUL)', startsAt: at(-3, 8), endsAt: at(-3, 13, 40), reference: 'Booking DEF456', memberIds: ['u-d2', 'u-d3'] },
      { id: 't3', kind: 'rental', direction: 'outbound', title: 'Rental car – 7-seater', from: 'KUL airport desk', startsAt: at(-3, 14), endsAt: at(2, 10), reference: 'Rental RNT789', notes: 'Driver: Sam. Return full tank.', memberIds: ['u-co'] },
      { id: 't4', kind: 'shuttle', direction: 'outbound', title: 'Airport shuttle to hotel', from: 'KUL arrivals, exit 4', to: 'Team hotel', startsAt: at(-3, 14, 15), memberIds: [] },
      { id: 't5', kind: 'hotel', direction: 'onsite', title: 'Team hotel', address: 'Sepang International Circuit, Malaysia', startsAt: at(-3, 15), endsAt: at(2, 11), reference: 'Group booking ART-12H', phone: '+60 0 000 0000', notes: 'Breakfast 06:00–10:00. Room list at reception.', memberIds: [] },
      { id: 't6', kind: 'shuttle', direction: 'onsite', title: 'Shuttle to circuit', from: 'Hotel lobby', to: 'Paddock gate', startsAt: at(0, 6, 30), notes: 'Daily, 06:30 and 07:30', memberIds: [] },
      { id: 't7', kind: 'restaurant', direction: 'onsite', title: 'Team dinner', address: 'Restaurant name and address', startsAt: at(-2, 20), phone: '+60 0 000 0001', memberIds: [] },
      { id: 't8', kind: 'flight', direction: 'return', title: 'Flight XX 102', from: 'Kuala Lumpur (KUL)', to: 'Hong Kong (HKG)', startsAt: at(2, 14, 20), endsAt: at(2, 18, 5), reference: 'Booking ABC123', memberIds: ['u-tm', 'u-co', 'u-eng1', 'u-d1'] },
      { id: 't9', kind: 'train', direction: 'return', title: 'KLIA Ekspres to city', from: 'Circuit', to: 'KL Sentral', startsAt: at(2, 9), endsAt: at(2, 10), memberIds: ['u-d2', 'u-d3'] },
    ],
    crew: [
      { memberId: 'u-tm', duty: 'Team manager' },
      { memberId: 'u-co', duty: 'Logistics and hospitality' },
      { memberId: 'u-eng1', carId: 'car-a', duty: 'Race engineer' },
      { memberId: 'u-d1', carId: 'car-a', duty: 'Driver' },
      { memberId: 'u-d2', carId: 'car-a', duty: 'Driver' },
      { memberId: 'u-d3', carId: 'car-b', duty: 'Driver' },
    ],
    links: [
      { label: 'Live timing', url: 'https://timingresult.com', kind: 'livetiming' },
      { label: 'Results', url: 'https://timingresult.com', kind: 'results' },
    ],
  },
  {
    id: 'gtwca-r1',
    name: 'GT World Challenge Asia – Round 1',
    championshipId: 'gtwca',
    circuit: 'Sepang International Circuit',
    location: 'Kuala Lumpur, Malaysia',
    latitude: 2.7608,
    longitude: 101.7382,
    startDate: date(40),
    endDate: date(42),
    summary: 'Season opener. Two one-hour races.',
    sessions: [
      { id: 'r1', startsAt: at(40, 11, 30), endsAt: at(40, 12, 30), title: 'Free practice 1' },
      { id: 'r2', startsAt: at(41, 10, 15), endsAt: at(41, 10, 45), title: 'Qualifying' },
      { id: 'r3', startsAt: at(41, 14, 30), endsAt: at(41, 15, 30), title: 'Race 1' },
      { id: 'r4', startsAt: at(42, 13), endsAt: at(42, 14), title: 'Race 2' },
    ],
    travel: [],
    crew: [
      { memberId: 'u-tm', duty: 'Team manager' },
      { memberId: 'u-eng1', carId: 'car-a', duty: 'Race engineer' },
      { memberId: 'u-d1', carId: 'car-a', duty: 'Driver' },
      { memberId: 'u-d2', carId: 'car-a', duty: 'Driver' },
    ],
    links: [{ label: 'Live timing', url: 'https://www.gt-world-challenge-asia.com', kind: 'livetiming' }],
  },
  {
    id: 'pcca-r1',
    name: 'Carrera Cup Asia – Round 1',
    championshipId: 'pcca',
    circuit: 'Shanghai International Circuit',
    location: 'Shanghai, China',
    latitude: 31.3389,
    longitude: 121.2197,
    startDate: date(-20),
    endDate: date(-18),
    summary: 'Two sprint races.',
    sessions: [{ id: 'p1', startsAt: at(-19, 10), endsAt: at(-19, 10, 30), title: 'Race 1' }],
    travel: [],
    crew: [{ memberId: 'u-d3', carId: 'car-b', duty: 'Driver' }],
    links: [
      { label: 'Results', url: 'https://timingresult.com', kind: 'results' },
      { label: 'Race highlights', url: 'https://www.youtube.com', kind: 'video' },
      { label: 'Onboard lap', url: 'https://www.youtube.com', kind: 'onboard' },
    ],
  },
];

export const news: NewsPost[] = [
  {
    id: 'n1',
    title: 'Race week at Sepang',
    body: 'Both cars are entered in the Sepang 12 Hours. Follow the live timing from the event page.',
    publishedAt: at(-2, 9),
    eventId: 'sepang-12h',
    audience: 'everyone',
  },
  {
    id: 'n2',
    title: 'Podium in Shanghai',
    body: 'Highlights and onboard footage are on the event page.',
    publishedAt: at(-18, 18),
    eventId: 'pcca-r1',
    audience: 'everyone',
  },
  {
    id: 'n3',
    title: 'Travel for Sepang confirmed',
    body: 'Flights and hotel are in the travel section of the event.',
    publishedAt: at(-5, 12),
    eventId: 'sepang-12h',
    audience: 'team',
  },
];

export const documents: TeamDocument[] = [
  { id: 'd1', title: 'Event briefing – Sepang 12h', category: 'briefing', eventId: 'sepang-12h', url: 'https://example.com/briefing.pdf', publishedAt: at(-2, 10), target: { type: 'all' } },
  { id: 'd2', title: 'Run plan – Car #1', category: 'runplan', eventId: 'sepang-12h', url: 'https://example.com/runplan-1.pdf', publishedAt: at(-1, 18), target: { type: 'car', carId: 'car-a' } },
  { id: 'd3', title: 'Run plan – Car #2', category: 'runplan', eventId: 'sepang-12h', url: 'https://example.com/runplan-2.pdf', publishedAt: at(-1, 18), target: { type: 'car', carId: 'car-b' } },
  { id: 'd4', title: 'Final timetable', category: 'timetable', eventId: 'sepang-12h', url: 'https://example.com/timetable.pdf', publishedAt: at(-3, 9), target: { type: 'all' } },
  { id: 'd5', title: 'Stewards decision – Car #1', category: 'bulletin', eventId: 'sepang-12h', url: 'https://example.com/decision.pdf', publishedAt: at(0, 7, 45), target: { type: 'car', carId: 'car-a' } },
  { id: 'd6', title: 'Autograph session details', category: 'media', eventId: 'sepang-12h', url: 'https://example.com/media.pdf', publishedAt: at(-1, 12), target: { type: 'role', role: 'driver' } },
];

export const alerts: Alert[] = [
  { id: 'a1', title: 'New stewards decision', body: 'A decision about Car #1 has been published.', sentAt: at(0, 7, 46), sentBy: 'Sam Coordinator', target: { type: 'car', carId: 'car-a' }, documentId: 'd5' },
  { id: 'a2', title: 'Run plans are out', body: 'Read your car’s run plan before the engineering briefing.', sentAt: at(-1, 18, 5), sentBy: 'Alex Team Manager', target: { type: 'role', role: 'driver' } },
  { id: 'a3', title: 'Shuttle time change', body: 'Tomorrow the shuttle leaves at 06:30.', sentAt: at(-1, 20), sentBy: 'Sam Coordinator', target: { type: 'all' } },
];

/** Demo read receipts: who has already read each document. */
export const documentReads: Record<string, string[]> = {
  d1: ['u-tm', 'u-co', 'u-eng1', 'u-d1', 'u-d3'],
  d2: ['u-eng1', 'u-d2'],
  d4: ['u-tm', 'u-co', 'u-eng1', 'u-d1', 'u-d2', 'u-d3'],
  d5: ['u-tm', 'u-co'],
};

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
  { id: 'm1', channelId: 'all-team', author: 'Alex Team Manager', body: 'Welcome to the team app!', sentAt: at(-3, 8) },
  { id: 'm2', channelId: 'drivers', author: 'Alex Team Manager', body: 'Debrief at 18:00 after practice.', sentAt: at(-1, 15) },
];
