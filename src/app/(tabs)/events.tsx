import { EventCard } from '@/components/event-card';
import { Empty, Screen, SectionTitle } from '@/components/ui';
import { getPastEvents, getUpcomingEvents } from '@/data/queries';

export default function EventsScreen() {
  const upcoming = getUpcomingEvents();
  const past = getPastEvents();

  return (
    <Screen title="Events">
      <SectionTitle>Upcoming</SectionTitle>
      {upcoming.length ? upcoming.map((e) => <EventCard key={e.id} event={e} />) : <Empty>Nothing scheduled.</Empty>}
      <SectionTitle>Past</SectionTitle>
      {past.length ? past.map((e) => <EventCard key={e.id} event={e} />) : <Empty>No past events.</Empty>}
    </Screen>
  );
}
