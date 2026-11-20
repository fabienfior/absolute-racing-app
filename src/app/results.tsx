import { router } from 'expo-router';
import { View } from 'react-native';

import { ExternalLink } from '@/components/external-link';
import { ThemedText } from '@/components/themed-text';
import { Button, Card, Empty, Icon, Row, Screen, SectionTitle } from '@/components/ui';
import { getAllTeamResults, getCar, getChampionship, getMedia } from '@/data/queries';
import { t } from '@/i18n';
import { formatDateRange } from '@/lib/format';

export default function ResultsScreen() {
  const results = getAllTeamResults();
  const events = [...new Map(results.map((r) => [r.event.id, r.event])).values()];
  const official = getMedia(['results']);

  return (
    <Screen>
      <Button label={t('title.standings')} icon="podium-outline" secondary onPress={() => router.push('/standings')} />
      {events.length ? (
        events.map((e) => (
          <View key={e.id} style={{ gap: 12 }}>
            <SectionTitle>{getChampionship(e.championshipId)?.short}</SectionTitle>
            <Card accent onPress={() => router.push({ pathname: '/event/[id]', params: { id: e.id } })}>
              <ThemedText style={{ fontWeight: 800, fontSize: 18, textTransform: 'uppercase' }}>{e.name}</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                {formatDateRange(e.startDate, e.endDate)}
              </ThemedText>
              {results
                .filter((r) => r.event.id === e.id)
                .map((r) => (
                  <Row key={r.session + r.carId} style={{ marginTop: 6 }}>
                    <ThemedText style={{ width: 48, fontWeight: 900, fontSize: 22 }}>P{r.position}</ThemedText>
                    <View style={{ flex: 1 }}>
                      <ThemedText type="small" style={{ fontWeight: 600 }}>
                        {r.session} · {t('today.car', { number: getCar(r.carId)?.number ?? '' })}
                      </ThemedText>
                      {r.classPosition ? (
                        <ThemedText type="small" themeColor="textSecondary">
                          {t('event.classPos', { pos: r.classPosition, class: r.className ?? '' })}
                        </ThemedText>
                      ) : null}
                    </View>
                    {r.position <= 3 || r.classPosition === 1 ? <Icon name="trophy" size={20} /> : null}
                  </Row>
                ))}
            </Card>
          </View>
        ))
      ) : (
        <Empty>{t('results.empty')}</Empty>
      )}

      {official.length ? (
        <>
          <SectionTitle>{t('results.official')}</SectionTitle>
          {official.map((m) => (
            <ExternalLink key={m.event.id + m.label} href={m.url as `https://${string}`} asChild>
              <Card>
                <Row>
                  <Icon name="document-text-outline" size={22} />
                  <ThemedText style={{ flex: 1, fontWeight: 600 }}>{m.event.name}</ThemedText>
                  <Icon name="open-outline" />
                </Row>
              </Card>
            </ExternalLink>
          ))}
        </>
      ) : null}
    </Screen>
  );
}
