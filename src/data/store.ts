import type { Car, Championship, Channel, GuideSection, Member, NewsPost, RaceEvent, SeriesSource, SeriesUpdate, Standings, TeamDocument, TeamResult } from '@/lib/types';

import * as demo from './demo';

/**
 * The content the screens read. Starts as the demo data in demo.ts; once Supabase is
 * connected, SessionProvider fills it from the database (see remote.ts) and re-renders.
 */
export type Store = {
  championships: Championship[];
  cars: Car[];
  members: Member[];
  events: RaceEvent[];
  news: NewsPost[];
  documents: TeamDocument[];
  guide: GuideSection[];
  channels: Channel[];
  teamResults: TeamResult[];
  standings: Standings[];
  seriesSources: SeriesSource[];
  seriesUpdates: SeriesUpdate[];
};

export const demoStore: Store = {
  championships: demo.championships,
  cars: demo.cars,
  members: demo.members,
  events: demo.events,
  news: demo.news,
  documents: demo.documents,
  guide: demo.guide,
  channels: demo.channels,
  teamResults: demo.teamResults,
  standings: demo.standings,
  seriesSources: demo.seriesSources,
  seriesUpdates: demo.seriesUpdates,
};

export const store: Store = { ...demoStore };

export function setStore(next: Store) {
  Object.assign(store, next);
}
