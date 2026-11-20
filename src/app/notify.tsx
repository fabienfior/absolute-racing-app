import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Button, Chip, Screen, SectionTitle } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { describeTarget, getAudience, getCars } from '@/data/queries';
import { useTheme } from '@/hooks/use-theme';
import { useSession } from '@/lib/session';
import type { Target } from '@/lib/types';

const TARGETS: Target[] = [
  { type: 'all' },
  { type: 'role', role: 'driver' },
  { type: 'role', role: 'management' },
  ...getCars().map((c) => ({ type: 'car' as const, carId: c.id })),
];

export default function NotifyScreen() {
  const theme = useTheme();
  const { profile, sendAlert } = useSession();
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [target, setTarget] = useState<Target>(TARGETS[0]);

  if (profile.role !== 'management') {
    return (
      <Screen>
        <ThemedText>Only management can send alerts.</ThemedText>
      </Screen>
    );
  }

  const input = [styles.input, { color: theme.text, backgroundColor: theme.backgroundElement }];
  const canSend = title.trim().length > 0;

  return (
    <Screen>
      <SectionTitle>Send to</SectionTitle>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two }}>
        {TARGETS.map((t) => (
          <Chip
            key={JSON.stringify(t)}
            label={describeTarget(t)}
            active={JSON.stringify(t) === JSON.stringify(target)}
            onPress={() => setTarget(t)}
          />
        ))}
      </View>
      <ThemedText type="small" themeColor="textSecondary">
        Reaches {getAudience(target).length} people
      </ThemedText>

      <SectionTitle>Message</SectionTitle>
      <TextInput value={title} onChangeText={setTitle} placeholder="Title" placeholderTextColor={theme.textSecondary} style={input} />
      <TextInput
        value={body}
        onChangeText={setBody}
        placeholder="Details (optional)"
        placeholderTextColor={theme.textSecondary}
        multiline
        style={[input, { minHeight: 100, textAlignVertical: 'top' }]}
      />
      <Button
        label="Send alert"
        icon="send"
        onPress={() => {
          if (!canSend) return;
          sendAlert({ title: title.trim(), body: body.trim(), target });
          router.back();
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  input: { borderRadius: 12, paddingHorizontal: Spacing.three, paddingVertical: 12, fontSize: 16 },
});
