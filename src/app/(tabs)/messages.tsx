import { router } from 'expo-router';
import { View } from 'react-native';

import { AlertBell } from '@/components/alert-bell';
import { ThemedText } from '@/components/themed-text';
import { Card, Row, Screen } from '@/components/ui';
import { Brand } from '@/constants/theme';
import { getChannels, getMessages, getUnreadByChannel } from '@/data/queries';
import { useTheme } from '@/hooks/use-theme';
import { t } from '@/i18n';
import { timeAgo } from '@/lib/format';
import { useSession } from '@/lib/session';

export default function MessagesScreen() {
  const theme = useTheme();
  const { profile, channelReadAt } = useSession();
  const channels = getChannels(profile.role);
  const unread = getUnreadByChannel(profile.role, channelReadAt, profile.name);

  return (
    <Screen title={t('tab.messages')} right={<AlertBell />}>
      {channels.map((c) => {
        const last = getMessages(c.id).at(-1);
        const count = unread[c.id] ?? 0;
        return (
          <Card
            key={c.id}
            accent={count > 0}
            onPress={() => router.push({ pathname: '/chat/[channelId]', params: { channelId: c.id } })}>
            <Row>
              <ThemedText style={{ flex: 1, fontWeight: count ? 800 : 600 }}># {c.name}</ThemedText>
              {last ? (
                <ThemedText type="small" themeColor="textSecondary">
                  {timeAgo(last.sentAt)}
                </ThemedText>
              ) : null}
            </Row>
            <Row>
              <ThemedText
                type="small"
                themeColor={count ? 'text' : 'textSecondary'}
                numberOfLines={1}
                style={{ flex: 1 }}>
                {last ? `${last.author}: ${last.body}` : t('messages.none')}
              </ThemedText>
              {count ? (
                <View style={{ minWidth: 22, height: 22, borderRadius: 11, backgroundColor: theme.tint, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6 }}>
                  <ThemedText style={{ color: Brand.primaryText, fontWeight: 800, fontSize: 12, lineHeight: 16 }}>{count}</ThemedText>
                </View>
              ) : null}
            </Row>
          </Card>
        );
      })}
    </Screen>
  );
}
