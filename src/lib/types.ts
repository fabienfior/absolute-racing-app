export type Role = 'management' | 'driver' | 'sponsor';

export const TEAM_ROLES: Role[] = ['management', 'driver'];
export const isTeam = (role: Role) => TEAM_ROLES.includes(role);

export type Profile = {
  id: string;
  fullName: string;
  role: Role;
};

export type MediaLink = {
  label: string;
  url: string;
  kind: 'results' | 'video' | 'onboard' | 'other';
};

export type TimetableItem = {
  day: string;
  time: string;
  title: string;
};

export type TravelItem = {
  kind: 'flight' | 'hotel' | 'transfer' | 'other';
  title: string;
  details: string;
  when: string;
};

export type RaceEvent = {
  id: string;
  name: string;
  circuit: string;
  location: string;
  startDate: string; // ISO date
  endDate: string;
  summary: string;
  timetable: TimetableItem[];
  travel: TravelItem[]; // team only
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
