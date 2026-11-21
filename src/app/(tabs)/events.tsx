import { router } from 'expo-router';
import { useState } from 'react';
import { ScrollView } from 'react-native';

import { EventCard } from '@/components/event-card';
import { ThemedText } from '@/components/themed-text';
import { Card, Chip, Empty, Icon, Pill, Row, Screen, SectionTitle } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { getChampionships, getPastEvents, getSeriesUpdates, getUpcomingEvents } from '@/data/queries';
import { t } from '@/i18n';
import { useSession } from '@/lib/session';
import { View } from 'react-native';

export default function EventsScreen() {
  const [champ, setChamp] = useState<string | null>(null);
  const keep = (e: { championshipId: string }) => !champ || e.championshipId === champ;
  const upcoming = getUpcomingEvents().filter(keep);
  const past = getPastEvents().filter(keep);
  const { seriesSeenAt } = useSession();
  const newSeries = getSeriesUpdates().filter((u) => u.foundAt > seriesSeenAt).length;

  return (
    <Screen home
      title={t('season.title')}
      right={
        <ThemedText type="linkPrimary" onPress={() => router.push('/standings')}>
          {t('title.standings')}
        </ThemedText>
      }>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: Spacing.two }}>
        <Chip label={t('common.all')} active={!champ} onPress={() => setChamp(null)} />
        {getChampionships().map((c) => (
          <Chip key={c.id} label={c.short} active={champ === c.id} onPress={() => setChamp(c.id)} />
        ))}
      </ScrollView>
      <Card onPress={() => router.push('/series')} accent>
        <Row>
          <Icon name="flag-outline" size={24} />
          <View style={{ flex: 1 }}>
            <ThemedText style={{ fontWeight: 700 }}>{t('series.title')}</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              {t('series.cta')}
            </ThemedText>
          </View>
          {newSeries ? <Pill label={t('menu.new', { count: newSeries })} /> : null}
        </Row>
      </Card>
      <SectionTitle>{t('season.upcoming')}</SectionTitle>
      {upcoming.length ? upcoming.map((e) => <EventCard key={e.id} event={e} />) : <Empty>{t('season.nothing')}</Empty>}
      <SectionTitle>{t('season.past')}</SectionTitle>
      {past.length ? past.map((e) => <EventCard key={e.id} event={e} />) : <Empty>{t('season.noPast')}</Empty>}
    </Screen>
  );
}
