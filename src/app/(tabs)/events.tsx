import { router } from 'expo-router';
import { useState } from 'react';
import { ScrollView } from 'react-native';

import { EventCard } from '@/components/event-card';
import { ThemedText } from '@/components/themed-text';
import { Chip, Empty, Screen, SectionTitle } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { getChampionships, getPastEvents, getUpcomingEvents } from '@/data/queries';

export default function EventsScreen() {
  const [champ, setChamp] = useState<string | null>(null);
  const keep = (e: { championshipId: string }) => !champ || e.championshipId === champ;
  const upcoming = getUpcomingEvents().filter(keep);
  const past = getPastEvents().filter(keep);

  return (
    <Screen
      title="Season"
      right={
        <ThemedText type="linkPrimary" onPress={() => router.push('/standings')}>
          Standings
        </ThemedText>
      }>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: Spacing.two }}>
        <Chip label="All" active={!champ} onPress={() => setChamp(null)} />
        {getChampionships().map((c) => (
          <Chip key={c.id} label={c.short} active={champ === c.id} onPress={() => setChamp(c.id)} />
        ))}
      </ScrollView>
      <SectionTitle>Upcoming</SectionTitle>
      {upcoming.length ? upcoming.map((e) => <EventCard key={e.id} event={e} />) : <Empty>Nothing scheduled.</Empty>}
      <SectionTitle>Past</SectionTitle>
      {past.length ? past.map((e) => <EventCard key={e.id} event={e} />) : <Empty>No past events.</Empty>}
    </Screen>
  );
}
