import { cars, championships, channels, documents, events, guide, members, messages, news, seriesSources, seriesUpdates, standings, teamResults } from '@/data/demo';
import { isForMember, isTeam, type Alert, type Channel, type Member, type Message, type OnboardFolder, type Role, type Target } from '@/lib/types';
import { t } from '@/i18n';

/**
 * Data access in one place. Each function maps to a Supabase query later;
 * row-level security in supabase/schema.sql enforces the same rules server-side.
 */
const todayStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

export function getUpcomingEvents() {
  const t = todayStr();
  return events.filter((e) => e.endDate >= t).sort((a, b) => a.startDate.localeCompare(b.startDate));
}

export function getPastEvents() {
  const t = todayStr();
  return events.filter((e) => e.endDate < t).sort((a, b) => b.startDate.localeCompare(a.startDate));
}

/** The event happening now, or the next one. */
export function getCurrentOrNextEvent() {
  return getUpcomingEvents()[0];
}

export function getEvent(id: string) {
  return events.find((e) => e.id === id);
}

export const getChampionship = (id: string) => championships.find((c) => c.id === id);
export const getCar = (id?: string) => cars.find((c) => c.id === id);
export const getMember = (id: string) => members.find((m) => m.id === id);
export const getCars = () => cars;

/** Sessions this member should see: whole-team sessions plus their own car's. */
export function getMySessions(eventId: string, member: Member) {
  const event = getEvent(eventId);
  if (!event) return [];
  return event.sessions
    .filter((s) => !s.carId || member.role === 'management' || s.carId === member.carId)
    .sort((a, b) => a.startsAt.localeCompare(b.startsAt));
}

export function getNews(role: Role) {
  return news
    .filter((n) => n.audience === 'everyone' || isTeam(role))
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
}

export function getDocuments(member: Member) {
  return documents
    .filter((d) => isForMember(d.target, member))
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
}

export const getDocument = (id: string) => documents.find((d) => d.id === id);

/** Team members a target reaches (for read-receipt counts). */
export function getAudience(target: Target) {
  return members.filter(
    (m) =>
      isTeam(m.role) &&
      (target.type === 'all' ||
        (target.type === 'role' && m.role === target.role) ||
        (target.type === 'car' && m.carId === target.carId)),
  );
}

export function describeTarget(target: Target) {
  if (target.type === 'all') return t('target.all');
  if (target.type === 'role') return target.role === 'driver' ? t('target.drivers') : t('target.management');
  const car = getCar(target.carId);
  return car ? t('today.car', { number: car.number }) : '';
}

export function getMyAlerts(alerts: Alert[], member: Member) {
  return alerts.filter((a) => isForMember(a.target, member));
}

export function getGuide() {
  return guide;
}

/** Private chat between two people: one channel id per pair. */
export const dmChannelId = (a: string, b: string) => `dm:${[a, b].sort().join(':')}`;
export const dmOther = (channelId: string, myId: string) =>
  channelId.startsWith('dm:') ? getMember(channelId.slice(3).split(':').find((id) => id !== myId) ?? '') : undefined;

/** Group channels for this role, plus private chats this person has messages in. */
export function getChannels(role: Role, list: Message[] = messages, myId = ''): Channel[] {
  const groups = channels.filter((c) => c.roles.includes(role));
  const dms = [...new Set(list.filter((m) => m.channelId.startsWith('dm:') && m.channelId.includes(myId)).map((m) => m.channelId))];
  return [
    ...groups,
    ...dms.map((id) => ({ id, name: dmOther(id, myId)?.name ?? '', roles: [] as Role[] })),
  ];
}

export function getMessages(channelId: string, list: Message[] = messages) {
  return list.filter((m) => m.channelId === channelId).sort((a, b) => a.sentAt.localeCompare(b.sentAt));
}

/** Travel items for one person (everyone-items plus their own), or all items for management's "Everyone" view. */
export function getTravel(eventId: string, member: Member, everyone = false) {
  const event = getEvent(eventId);
  if (!event) return [];
  return event.travel
    .filter((t) => everyone || t.memberIds.length === 0 || t.memberIds.includes(member.id))
    .sort((a, b) => a.startsAt.localeCompare(b.startsAt));
}

export const getChampionships = () => championships;
export const getTeamResults = (eventId: string) => teamResults.filter((r) => r.eventId === eventId);
export const getStandings = () => standings;

/** Unread messages per channel for this person (messages by others after their last visit). */
export function getUnreadByChannel(list: Message[], member: Member, readAt: Record<string, string>) {
  const out: Record<string, number> = {};
  for (const c of getChannels(member.role, list, member.id)) {
    const since = readAt[c.id] ?? '';
    out[c.id] = list.filter((m) => m.channelId === c.id && m.author !== member.name && m.sentAt > since).length;
  }
  return out;
}

export function getUnreadMessages(list: Message[], member: Member, readAt: Record<string, string>) {
  return Object.values(getUnreadByChannel(list, member, readAt)).reduce((a, b) => a + b, 0);
}

/** Every onboard and video link across the season, newest event first. */
export function getMedia(kinds: string[] = ['onboard', 'video']) {
  return [...events]
    .sort((a, b) => b.startDate.localeCompare(a.startDate))
    .flatMap((e) => e.links.filter((l) => kinds.includes(l.kind)).map((l) => ({ ...l, event: e })));
}

/** All our results across the season, newest first. */
export function getAllTeamResults() {
  return teamResults
    .map((r) => ({ ...r, event: getEvent(r.eventId)! }))
    .filter((r) => r.event)
    .sort((a, b) => b.event.startDate.localeCompare(a.event.startDate));
}

/** Official series pages and the documents found on them, newest first. */
export const getSeriesSources = (championshipId?: string) =>
  seriesSources.filter((s) => !championshipId || s.championshipId === championshipId);

export const getSeriesUpdates = (championshipId?: string) =>
  seriesUpdates
    .filter((u) => !championshipId || u.championshipId === championshipId)
    .sort((a, b) => b.foundAt.localeCompare(a.foundAt));

/** "Sepang 12 Hours · #1 GT3 car" */
export function folderSubtitle(f: OnboardFolder) {
  const event = f.eventId ? getEvent(f.eventId) : undefined;
  const car = getCar(f.carId);
  return [event?.name, car ? `${car.number} ${car.model}` : t('onboards.wholeTeam')].filter(Boolean).join(' · ');
}

