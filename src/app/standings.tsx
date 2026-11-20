import { View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Card, Empty, Row, Screen, SectionTitle } from '@/components/ui';
import { getChampionship, getStandings } from '@/data/queries';
import { useTheme } from '@/hooks/use-theme';
import { formatDate } from '@/lib/format';

export default function StandingsScreen() {
  const theme = useTheme();
  return (
    <Screen>
      {getStandings().map((st) => (
        <View key={st.championshipId + st.title} style={{ gap: 12 }}>
          <SectionTitle>{getChampionship(st.championshipId)?.name}</SectionTitle>
          <Card style={{ gap: 8 }}>
            <ThemedText style={{ fontWeight: 700 }}>{st.title}</ThemedText>
            {st.rows.length ? (
              st.rows.map((r) => (
                <Row key={r.position}>
                  <ThemedText style={{ width: 28, fontWeight: 700 }}>{r.position}</ThemedText>
                  <ThemedText style={{ flex: 1, fontWeight: r.ours ? 700 : 500, color: r.ours ? theme.tint : theme.text }}>
                    {r.name}
                  </ThemedText>
                  <ThemedText style={{ fontVariant: ['tabular-nums'] }}>{r.points} pts</ThemedText>
                </Row>
              ))
            ) : (
              <Empty>Standings will appear after the first round.</Empty>
            )}
            <ThemedText type="small" themeColor="textSecondary">
              Updated {formatDate(st.updatedAt)}
            </ThemedText>
          </Card>
        </View>
      ))}
    </Screen>
  );
}
