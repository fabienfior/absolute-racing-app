import { router } from 'expo-router';
import { View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Button, Card, Dot, Empty, Row, Screen } from '@/components/ui';
import { describeTarget, getMyAlerts } from '@/data/queries';
import { useTheme } from '@/hooks/use-theme';
import { timeAgo } from '@/lib/format';
import { useSession } from '@/lib/session';
import { t } from '@/i18n';

export default function AlertsScreen() {
  const theme = useTheme();
  const { alerts, profile, readAlertIds, markAlertRead } = useSession();
  const mine = getMyAlerts(alerts, profile);

  return (
    <Screen>
      {profile.role === 'crew' ? (
        <Button label={t('title.sendAlert')} icon="megaphone-outline" onPress={() => router.push('/notify')} />
      ) : null}
      {mine.length ? (
        mine.map((a) => {
          const unread = !readAlertIds.has(a.id);
          return (
            <Card
              key={a.id}
              onPress={() => {
                markAlertRead(a.id);
                if (a.documentId) router.push({ pathname: '/document/[id]', params: { id: a.documentId } });
              }}>
              <Row style={{ alignItems: 'flex-start' }}>
                <View style={{ flex: 1, gap: 2 }}>
                  <ThemedText style={{ fontWeight: unread ? 700 : 500 }}>{a.title}</ThemedText>
                  <ThemedText type="small">{a.body}</ThemedText>
                  <ThemedText type="small" themeColor="textSecondary">
                    {a.sentBy} → {describeTarget(a.target)} · {timeAgo(a.sentAt)}
                    {a.documentId ? ` · ${t('alerts.tapToOpen')}` : ''}
                  </ThemedText>
                </View>
                {unread ? <Dot color={theme.tint} /> : null}
              </Row>
            </Card>
          );
        })
      ) : (
        <Empty>{t('alerts.empty')}</Empty>
      )}
    </Screen>
  );
}
