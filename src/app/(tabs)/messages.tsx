import { router } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { Card, Screen } from '@/components/ui';
import { getChannels, getMessages } from '@/data/queries';
import { useSession } from '@/lib/session';

export default function MessagesScreen() {
  const { profile } = useSession();
  const channels = getChannels(profile.role);

  return (
    <Screen title="Messages">
      {channels.map((c) => {
        const last = getMessages(c.id).at(-1);
        return (
          <Card key={c.id} onPress={() => router.push({ pathname: '/chat/[channelId]', params: { channelId: c.id } })}>
            <ThemedText style={{ fontWeight: 700 }}># {c.name}</ThemedText>
            <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>
              {last ? `${last.author}: ${last.body}` : 'No messages yet'}
            </ThemedText>
          </Card>
        );
      })}
    </Screen>
  );
}
