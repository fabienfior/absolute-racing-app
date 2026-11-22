import type { SupabaseClient } from '@supabase/supabase-js';

import type {
  Alert,
  Member,
  Message,
  OnboardFolder,
  RaceEvent,
  Role,
  Target,
  TeamDocument,
} from '@/lib/types';

import type { Store } from './store';

/**
 * Reads the database into the shapes the screens use. Row-level security decides what comes
 * back: visitors and sponsors only get public content, drivers what is aimed at them, crew all.
 */
export type RemoteData = {
  store: Store;
  me: Member | null;
  alerts: Alert[];
  readAlertIds: string[];
  docReads: Record<string, string[]>;
  messages: Message[];
  folders: OnboardFolder[];
};

type Row = Record<string, any>;

/** Throws on error so the caller can fall back to demo data. */
async function rows(query: PromiseLike<{ data: Row[] | null; error: { message: string; code?: string } | null }>): Promise<Row[]> {
  const { data, error } = await query;
  if (error) throw new SetupError(error.message, error.code === 'PGRST205' || error.code === '42P01' || /schema cache|does not exist/.test(error.message));
  return data ?? [];
}

/** `missingTables` = the database has not been set up yet (schema.sql not run). */
export class SetupError extends Error {
  constructor(message: string, readonly missingTables: boolean) {
    super(message);
  }
}

const opt = <T,>(v: T | null | undefined) => (v === null ? undefined : v);
/** Database times → the same ISO form the app writes, so times compare and sort as text. */
const iso = (v: string) => new Date(v).toISOString();
const isoOpt = (v?: string | null) => (v ? iso(v) : undefined);

export function toTarget(type: string, role?: string | null, car?: string | null): Target {
  if (type === 'role' && role) return { type: 'role', role: role as Role };
  if (type === 'car' && car) return { type: 'car', carId: car };
  return { type: 'all' };
}

export function fromTarget(target: Target) {
  return {
    target_type: target.type,
    target_role: target.type === 'role' ? target.role : null,
    target_car: target.type === 'car' ? target.carId : null,
  };
}

const toMember = (p: Row): Member => ({
  id: p.id,
  name: p.full_name || '',
  role: p.role,
  jobTitle: p.job_title ?? '',
  carId: opt(p.car_id),
  phone: opt(p.phone),
});

export const toMessage = (m: Row, names: Map<string, string>): Message => ({
  id: m.id,
  channelId: m.channel_id ?? dmId(m.author_id, m.recipient_id),
  author: names.get(m.author_id) ?? '',
  authorId: m.author_id,
  body: m.body,
  sentAt: iso(m.sent_at),
});

export const toAlert = (a: Row, names: Map<string, string>): Alert => ({
  id: a.id,
  title: a.title,
  body: a.body ?? '',
  sentAt: iso(a.sent_at),
  sentBy: a.sent_by ? (names.get(a.sent_by) ?? '') : 'Series update',
  target: toTarget(a.target_type, a.target_role, a.target_car),
  documentId: opt(a.document_id),
});

const dmId = (a: string, b: string) => `dm:${[a, b].sort().join(':')}`;

export async function loadRemote(db: SupabaseClient, userId: string | null): Promise<RemoteData> {
  const signedIn = !!userId;
  const [championships, cars, events, sessions, links, news, results, standings, sources, updates] = await Promise.all([
    rows(db.from('championships').select('*')),
    rows(db.from('cars').select('*').order('number')),
    rows(db.from('events').select('*')),
    rows(db.from('sessions').select('*')),
    rows(db.from('event_links').select('*').order('position')),
    rows(db.from('news_posts').select('*')),
    rows(db.from('team_results').select('*')),
    rows(db.from('standings').select('*')),
    rows(db.from('series_sources').select('*')),
    rows(db.from('series_updates').select('*').order('found_at', { ascending: false }).limit(300)),
  ]);

  // Team tables: row-level security returns nothing to sponsors, so these are safe to ask for.
  const none = Promise.resolve([] as Row[]);
  const [profiles, crew, travel, travelMembers, documents, docReads, alerts, alertReads, guide, channels, messages, folders, videos] =
    await Promise.all([
      signedIn ? rows(db.from('profiles').select('*')) : none,
      signedIn ? rows(db.from('crew_assignments').select('*')) : none,
      signedIn ? rows(db.from('travel_items').select('*')) : none,
      signedIn ? rows(db.from('travel_members').select('*')) : none,
      signedIn ? rows(db.from('documents').select('*')) : none,
      signedIn ? rows(db.from('document_reads').select('document_id, member_id')) : none,
      signedIn ? rows(db.from('alerts').select('*').order('sent_at', { ascending: false }).limit(200)) : none,
      signedIn ? rows(db.from('alert_reads').select('alert_id').eq('member_id', userId)) : none,
      signedIn ? rows(db.from('guide_sections').select('*').order('position')) : none,
      signedIn ? rows(db.from('channels').select('*').order('position')) : none,
      signedIn ? rows(db.from('messages').select('*').order('sent_at', { ascending: false }).limit(500)) : none,
      signedIn ? rows(db.from('onboard_folders').select('*').order('created_at', { ascending: false })) : none,
      signedIn ? rows(db.from('onboard_videos').select('*')) : none,
    ]);

  const members = profiles.map(toMember);
  const names = new Map(members.map((m) => [m.id, m.name]));
  const me = members.find((m) => m.id === userId) ?? null;

  // Files kept in Storage open through a link that lasts a week.
  const paths = documents.filter((d) => !d.url && d.storage_path).map((d) => d.storage_path as string);
  const signed = new Map<string, string>();
  if (paths.length) {
    const { data } = await db.storage.from('documents').createSignedUrls(paths, 7 * 86_400);
    for (const s of data ?? []) if (s.path && s.signedUrl) signed.set(s.path, s.signedUrl);
  }

  const by = <T extends Row>(list: T[], key: string) => {
    const map = new Map<string, T[]>();
    for (const r of list) map.set(r[key], [...(map.get(r[key]) ?? []), r]);
    return map;
  };
  const sessionsBy = by(sessions, 'event_id');
  const linksBy = by(links, 'event_id');
  const crewBy = by(crew, 'event_id');
  const travelBy = by(travel, 'event_id');
  const travelMembersBy = by(travelMembers, 'travel_id');
  const videosBy = by(videos, 'folder_id');

  const raceEvents: RaceEvent[] = events.map((e) => ({
    id: e.id,
    name: e.name,
    championshipId: e.championship_id ?? '',
    circuit: e.circuit ?? '',
    location: e.location ?? '',
    latitude: e.latitude ?? 0,
    longitude: e.longitude ?? 0,
    startDate: e.start_date,
    endDate: e.end_date,
    summary: e.summary ?? '',
    sessions: (sessionsBy.get(e.id) ?? []).map((s) => ({ id: s.id, startsAt: iso(s.starts_at), endsAt: iso(s.ends_at), title: s.title, carId: opt(s.car_id) })),
    travel: (travelBy.get(e.id) ?? []).map((t) => ({
      id: t.id,
      kind: t.kind,
      direction: t.direction,
      title: t.title,
      startsAt: iso(t.starts_at),
      endsAt: isoOpt(t.ends_at),
      from: opt(t.from_place),
      to: opt(t.to_place),
      reference: opt(t.reference),
      address: opt(t.address),
      phone: opt(t.phone),
      notes: opt(t.notes),
      memberIds: (travelMembersBy.get(t.id) ?? []).map((m) => m.member_id),
    })),
    crew: (crewBy.get(e.id) ?? []).map((c) => ({ memberId: c.member_id, carId: opt(c.car_id), duty: c.duty ?? '' })),
    links: [
      ...(linksBy.get(e.id) ?? []).map((l) => ({ label: l.label, url: l.url, kind: l.kind })),
      ...(e.series_url ? [{ label: 'Series website', url: e.series_url, kind: 'other' as const }] : []),
    ],
  }));

  const docs: TeamDocument[] = documents
    .map((d) => ({
      id: d.id,
      title: d.title,
      category: d.category,
      eventId: opt(d.event_id),
      url: d.url ?? signed.get(d.storage_path) ?? '',
      publishedAt: iso(d.published_at),
      target: toTarget(d.target_type, d.target_role, d.target_car),
    }))
    .filter((d) => d.url);

  const reads: Record<string, string[]> = {};
  for (const r of docReads) (reads[r.document_id] ??= []).push(r.member_id);

  return {
    me,
    store: {
      championships: championships.map((c) => ({ id: c.id, name: c.name, short: c.short_name })),
      cars: cars.map((c) => ({ id: c.id, number: c.number, model: c.model, championshipId: c.championship_id ?? '' })),
      members,
      events: raceEvents,
      news: news.map((n) => ({ id: n.id, title: n.title, body: n.body ?? '', publishedAt: iso(n.published_at), eventId: opt(n.event_id), audience: n.audience })),
      documents: docs,
      guide: guide.map((g) => ({ id: g.id, title: g.title, body: g.body ?? '' })),
      channels: channels.map((c) => ({ id: c.id, name: c.name, roles: c.roles })),
      teamResults: results.map((r) => ({
        eventId: r.event_id,
        session: r.session,
        carId: r.car_id,
        position: r.position,
        classPosition: opt(r.class_position),
        className: opt(r.class_name),
      })),
      standings: standings.map((s) => ({ championshipId: s.championship_id, title: s.title, updatedAt: iso(s.updated_at), rows: s.rows ?? [] })),
      seriesSources: sources.map((s) => ({ championshipId: s.championship_id, kind: s.kind, label: s.label, url: s.url })),
      seriesUpdates: updates.map((u) => ({ id: u.id, championshipId: u.championship_id, kind: u.kind, title: u.title, url: u.url, foundAt: iso(u.found_at) })),
    },
    alerts: alerts.map((a) => toAlert(a, names)),
    readAlertIds: alertReads.map((r) => r.alert_id),
    docReads: reads,
    messages: messages.map((m) => toMessage(m, names)).reverse(),
    folders: folders.map((f) => ({
      id: f.id,
      name: f.name,
      eventId: opt(f.event_id),
      carId: opt(f.car_id),
      driveUrl: f.drive_url,
      videos: (videosBy.get(f.id) ?? []).map((v) => ({ id: v.id, label: v.label, url: v.url })),
      createdAt: iso(f.created_at),
      createdBy: names.get(f.created_by) ?? '',
    })),
  };
}

/** A random id made on the phone, so a new folder can be opened before the database answers. */
export function newId() {
  const h = '0123456789abcdef';
  let s = '';
  for (let i = 0; i < 32; i++) s += h[i === 12 ? 4 : i === 16 ? 8 + Math.floor(Math.random() * 4) : Math.floor(Math.random() * 16)];
  return `${s.slice(0, 8)}-${s.slice(8, 12)}-${s.slice(12, 16)}-${s.slice(16, 20)}-${s.slice(20)}`;
}
