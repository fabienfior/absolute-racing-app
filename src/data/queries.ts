import { channels, events, guide, messages, news } from '@/data/demo';
import { isTeam, type Role } from '@/lib/types';

/**
 * Data access in one place. Each function maps to a Supabase query later;
 * row-level security in supabase/schema.sql enforces the same role rules server-side.
 */
const today = () => new Date().toISOString().slice(0, 10);

export function getUpcomingEvents() {
  return events.filter((e) => e.endDate >= today()).sort((a, b) => a.startDate.localeCompare(b.startDate));
}

export function getPastEvents() {
  return events.filter((e) => e.endDate < today()).sort((a, b) => b.startDate.localeCompare(a.startDate));
}

export function getEvent(id: string) {
  return events.find((e) => e.id === id);
}

export function getNews(role: Role) {
  return news
    .filter((n) => n.audience === 'everyone' || isTeam(role))
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
}

export function getGuide() {
  return guide;
}

export function getChannels(role: Role) {
  return channels.filter((c) => c.roles.includes(role));
}

export function getMessages(channelId: string) {
  return messages.filter((m) => m.channelId === channelId);
}
