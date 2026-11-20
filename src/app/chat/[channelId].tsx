import { Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Pressable, StyleSheet, TextInput, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Empty, Icon, Screen } from '@/components/ui';
import { FontFamily, Spacing } from '@/constants/theme';
import { channels } from '@/data/demo';
import { dmOther, getMessages } from '@/data/queries';
import { useTheme } from '@/hooks/use-theme';
import { t } from '@/i18n';
import { formatTime } from '@/lib/format';
import { useSession } from '@/lib/session';

export default function ChatScreen() {
  const { channelId } = useLocalSearchParams<{ channelId: string }>();
  const { profile, markChannelRead, messages, sendMessage } = useSession();
  const theme = useTheme();
  const items = getMessages(channelId, messages);
  const [text, setText] = useState('');

  // Opening the chat (and new messages while it's open) clears its unread count.
  useEffect(() => {
    markChannelRead(channelId);
  }, [channelId, markChannelRead, items.length]);

  const other = dmOther(channelId, profile.id);
  const channel = channels.find((c) => c.id === channelId);
  const title = other ? other.name : channel ? `# ${channel.name}` : t('title.chat');

  const send = () => {
    const body = text.trim();
    if (!body) return;
    sendMessage(channelId, body);
    setText('');
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: theme.background }} behavior="padding">
      <Stack.Screen options={{ title }} />
      <View style={{ flex: 1 }}>
        <Screen>
          {items.length ? null : <Empty>{other ? t('messages.start', { name: other.name.split(' ')[0] }) : t('messages.none')}</Empty>}
          {items.map((m) => {
            const mine = m.author === profile.name;
            return (
              <View
                key={m.id}
                style={[
                  styles.bubble,
                  mine
                    ? { alignSelf: 'flex-end', backgroundColor: theme.tint }
                    : { alignSelf: 'flex-start', backgroundColor: theme.backgroundElement, borderColor: theme.border, borderWidth: 1 },
                ]}>
                {!mine && !other ? (
                  <ThemedText type="label" style={{ fontSize: 11 }}>
                    {m.author}
                  </ThemedText>
                ) : null}
                <ThemedText style={mine ? { color: '#0B0E14' } : undefined}>{m.body}</ThemedText>
                <ThemedText type="small" style={{ fontSize: 11, lineHeight: 14, alignSelf: 'flex-end', color: mine ? '#0B0E14AA' : theme.textSecondary }}>
                  {formatTime(m.sentAt)}
                </ThemedText>
              </View>
            );
          })}
        </Screen>
      </View>
      <View style={[styles.composer, { borderTopColor: theme.border, backgroundColor: theme.background }]}>
        <TextInput
          value={text}
          onChangeText={setText}
          onSubmitEditing={send}
          placeholder={t('messages.placeholder')}
          placeholderTextColor={theme.textSecondary}
          style={[styles.input, { color: theme.text, backgroundColor: theme.backgroundElement, borderColor: theme.border }]}
        />
        <Pressable onPress={send} accessibilityLabel={t('common.send')} style={[styles.send, { backgroundColor: theme.tint }]}>
          <Icon name="send" color="#0B0E14" size={20} />
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  bubble: { maxWidth: '82%', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 2, gap: 2 },
  composer: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two, padding: Spacing.three, borderTopWidth: 1 },
  input: { flex: 1, borderWidth: 1, borderRadius: 2, paddingHorizontal: Spacing.three, paddingVertical: 12, fontSize: 16, fontFamily: FontFamily.regular },
  send: { width: 46, height: 46, alignItems: 'center', justifyContent: 'center', transform: [{ skewX: '-12deg' }] },
});
