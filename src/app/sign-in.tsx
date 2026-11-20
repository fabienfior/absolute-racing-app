import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Button, Card, Screen, SectionTitle } from '@/components/ui';
import { FontFamily, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { t } from '@/i18n';
import { useSession } from '@/lib/session';
import { supabase } from '@/lib/supabase';
import type { Role } from '@/lib/types';

/**
 * Team sign-in by email link (Supabase magic link): no passwords to manage.
 * Until Supabase is connected, demo buttons let you enter as a role.
 */
export default function SignInScreen() {
  const theme = useTheme();
  const { enter } = useSession();
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<string | null>(null);

  const send = async () => {
    if (!supabase) {
      setStatus(t('signin.comingSoon'));
      return;
    }
    const { error } = await supabase.auth.signInWithOtp({ email: email.trim() });
    setStatus(error ? error.message : '✓');
  };

  const demo = (role: Role) => {
    enter('team', role);
    router.dismissAll();
    router.replace('/');
  };

  return (
    <Screen>
      <ThemedText type="small" themeColor="textSecondary">
        {t('signin.email')}
      </ThemedText>
      <TextInput
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        autoComplete="email"
        keyboardType="email-address"
        placeholder="name@absoluteracing.net"
        placeholderTextColor={theme.textSecondary}
        style={[styles.input, { color: theme.text, backgroundColor: theme.backgroundElement, borderColor: theme.border }]}
      />
      <Button label={t('signin.send')} icon="mail-outline" onPress={send} />
      {status ? (
        <Card>
          <ThemedText type="small">{status}</ThemedText>
        </Card>
      ) : null}
      <ThemedText type="small" themeColor="textSecondary">
        {t('signin.note')}
      </ThemedText>

      <SectionTitle>{t('signin.demo')}</SectionTitle>
      <View style={{ gap: Spacing.three }}>
        <Button label={t('role.management')} secondary onPress={() => demo('management')} />
        <Button label={t('role.driver')} secondary onPress={() => demo('driver')} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  input: { borderWidth: 1, borderRadius: 2, paddingHorizontal: Spacing.three, paddingVertical: 14, fontSize: 16, fontFamily: FontFamily.regular },
});
