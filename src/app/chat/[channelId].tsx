import { Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Pressable, StyleSheet, TextInput, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Card, Icon, Screen } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { channels } from '@/data/demo';
import { getMessages } from '@/data/queries';
import { useTheme } from '@/hooks/use-theme';
import { formatTime } from '@/lib/format';
import { useSession } from '@/lib/session';
import type { Message } from '@/lib/types';
import { t } from '@/i18n';

export default function ChatScreen() {
  const { channelId } = useLocalSearchParams<{ channelId: string }>();
  const { profile } = useSession();
  const theme = useTheme();
  const channel = channels.find((c) => c.id === channelId);
  // Local only for now; Supabase Realtime will replace this.
  const [items, setItems] = useState<Message[]>(() => getMessages(channelId));
  const [text, setText] = useState('');

  const send = () => {
    const body = text.trim();
    if (!body) return;
    setItems((prev) => [
      ...prev,
      { id: String(Date.now()), channelId, author: profile.name, body, sentAt: new Date().toISOString() },
    ]);
    setText('');
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: theme.background }} behavior="padding">
      <Stack.Screen options={{ title: channel ? `# ${channel.name}` : t('title.chat') }} />
      <View style={{ flex: 1 }}>
        <Screen>
          {items.map((m) => (
            <Card key={m.id}>
              <ThemedText type="small" themeColor="textSecondary">
                {m.author} · {formatTime(m.sentAt)}
              </ThemedText>
              <ThemedText>{m.body}</ThemedText>
            </Card>
          ))}
        </Screen>
      </View>
      <View style={[styles.composer, { borderTopColor: theme.border, backgroundColor: theme.background }]}>
        <TextInput
          value={text}
          onChangeText={setText}
          onSubmitEditing={send}
          placeholder={t('messages.placeholder')}
          placeholderTextColor={theme.textSecondary}
          style={[styles.input, { color: theme.text, backgroundColor: theme.backgroundElement }]}
        />
        <Pressable onPress={send} accessibilityLabel={t('common.send')} style={styles.send}>
          <Icon name="send" color={theme.tint} size={22} />
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  composer: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two, padding: Spacing.three, borderTopWidth: 1 },
  input: { flex: 1, borderRadius: 20, paddingHorizontal: Spacing.three, paddingVertical: 10, fontSize: 16 },
  send: { padding: Spacing.one },
});
