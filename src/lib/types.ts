export type Role = 'management' | 'driver' | 'sponsor';

export const TEAM_ROLES: Role[] = ['management', 'driver'];
export const isTeam = (role: Role) => TEAM_ROLES.includes(role);

export type Championship = {
  id: string;
  name: string;
  short: string;
};

export type Car = {
  id: string;
  number: string;
  model: string;
  championshipId: string;
};

export type Member = {
  id: string;
  name: string;
  role: Role;
  jobTitle: string; // e.g. Team manager, Race engineer, Driver, Mechanic
  carId?: string;
  phone?: string; // visible to management only
};

export type Profile = Member;

export type MediaLink = {
  label: string;
  url: string;
  kind: 'results' | 'livetiming' | 'stream' | 'video' | 'onboard' | 'other';
};

export type Session = {
  id: string;
  startsAt: string; // ISO datetime
  endsAt: string;
  title: string;
  carId?: string; // only for one car; otherwise whole team
};

export type TravelItem = {
  kind: 'flight' | 'hotel' | 'transfer' | 'other';
  title: string;
  details: string;
  when: string;
};

export type CrewAssignment = {
  memberId: string;
  carId?: string;
  duty: string; // what they do at this event
};

export type RaceEvent = {
  id: string;
  name: string;
  championshipId: string;
  circuit: string;
  location: string;
  latitude: number;
  longitude: number;
  startDate: string; // ISO date
  endDate: string;
  summary: string;
  sessions: Session[];
  travel: TravelItem[]; // team only
  crew: CrewAssignment[]; // team only
  links: MediaLink[];
};

export type NewsPost = {
  id: string;
  title: string;
  body: string;
  publishedAt: string;
  eventId?: string;
  audience: 'everyone' | 'team';
};

export type GuideSection = {
  id: string;
  title: string;
  body: string;
};

export type DocCategory = 'briefing' | 'runplan' | 'timetable' | 'bulletin' | 'media' | 'other';

export const DOC_CATEGORIES: { id: DocCategory; label: string }[] = [
  { id: 'briefing', label: 'Briefings' },
  { id: 'runplan', label: 'Run plans' },
  { id: 'timetable', label: 'Timetables' },
  { id: 'bulletin', label: 'Bulletins & decisions' },
  { id: 'media', label: 'Media' },
  { id: 'other', label: 'Other' },
];

/** Who a document or alert is for. */
export type Target =
  | { type: 'all' }
  | { type: 'role'; role: Role }
  | { type: 'car'; carId: string };

export type TeamDocument = {
  id: string;
  title: string;
  category: DocCategory;
  eventId?: string;
  url: string;
  publishedAt: string;
  target: Target;
};

export type Alert = {
  id: string;
  title: string;
  body: string;
  sentAt: string;
  sentBy: string;
  target: Target;
  documentId?: string;
};

export type Channel = {
  id: string;
  name: string;
  roles: Role[];
};

export type Message = {
  id: string;
  channelId: string;
  author: string;
  body: string;
  sentAt: string;
};

export function isForMember(target: Target, member: Member) {
  if (member.role === 'management') return true;
  if (target.type === 'all') return true;
  if (target.type === 'role') return target.role === member.role;
  return target.carId === member.carId;
}
