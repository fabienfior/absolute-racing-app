import { useEffect, useState } from 'react';
import { ScrollView, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Card, Chip, Empty, Icon, Pill, Row, Screen, SectionTitle } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { getChampionship, getChampionships, getSeriesSources, getSeriesUpdates } from '@/data/queries';
import { t } from '@/i18n';
import { timeAgo } from '@/lib/format';
import { openLink } from '@/lib/open-link';
import { useSession } from '@/lib/session';

/** Documents found on the official series websites (bulletins, timetables, entry lists) and links to them. */
export default function SeriesScreen() {
  const { seriesSeenAt, markSeriesSeen } = useSession();
  const [seenAt] = useState(seriesSeenAt); // keep "new" tags while the page is open
  const [champ, setChamp] = useState<string | undefined>();
  const updates = getSeriesUpdates(champ);
  const sources = getSeriesSources(champ);
  useEffect(() => markSeriesSeen(), [markSeriesSeen]);

  return (
    <Screen>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: Spacing.two }}>
        <Chip label={t('common.all')} active={!champ} onPress={() => setChamp(undefined)} />
        {getChampionships().map((c) => (
          <Chip key={c.id} label={c.short} active={champ === c.id} onPress={() => setChamp(c.id)} />
        ))}
      </ScrollView>
      <ThemedText type="small" themeColor="textSecondary">
        {t('series.hint')}
      </ThemedText>

      <SectionTitle>{t('series.latest')}</SectionTitle>
      {updates.length ? (
        updates.map((u) => (
          <Card key={u.id} onPress={() => openLink(u.url)} accent={u.foundAt > seenAt}>
            <Row>
              <Icon name="document-text-outline" size={24} />
              <View style={{ flex: 1, gap: 2 }}>
                <ThemedText style={{ fontWeight: 700 }}>{u.title}</ThemedText>
                <ThemedText type="small" themeColor="textSecondary">
                  {getChampionship(u.championshipId)?.short} · {timeAgo(u.foundAt)}
                </ThemedText>
              </View>
              {u.foundAt > seenAt ? <Pill label={t('series.new')} /> : null}
            </Row>
          </Card>
        ))
      ) : (
        <Empty>{t('series.empty')}</Empty>
      )}

      <SectionTitle>{t('series.pages')}</SectionTitle>
      {sources.map((s) => (
        <Card key={s.championshipId + s.url + s.label} onPress={() => openLink(s.url)}>
          <Row>
            <Icon name="globe-outline" size={22} />
            <View style={{ flex: 1 }}>
              <ThemedText style={{ fontWeight: 700 }}>{s.label}</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                {getChampionship(s.championshipId)?.short} · {new URL(s.url).hostname.replace('www.', '')}
              </ThemedText>
            </View>
            <Icon name="open-outline" size={18} />
          </Row>
        </Card>
      ))}
    </Screen>
  );
}
