import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Button, Card, Screen, SectionTitle } from '@/components/ui';
import { FontFamily, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { t } from '@/i18n';
import { useSession } from '@/lib/session';
import type { Role } from '@/lib/types';

/**
 * Sign-in with a 6-digit code sent by email (Supabase email OTP): no passwords to manage.
 * In demo mode (database not set up yet), demo buttons let you enter as a role.
 */
export default function SignInScreen() {
  const theme = useTheme();
  const { live, enter, requestCode, verifyCode } = useSession();
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  const inputStyle = [styles.input, { color: theme.text, backgroundColor: theme.backgroundElement, borderColor: theme.border }];

  const send = async () => {
    if (!email.includes('@') || busy) return;
    setBusy(true);
    const error = await requestCode(email);
    setBusy(false);
    if (error === 'not-connected') return setStatus(t('signin.comingSoon'));
    setStatus(error ?? t('signin.codeSent'));
    if (!error) setSent(true);
  };

  const verify = async () => {
    if (code.trim().length < 6 || busy) return;
    setBusy(true);
    setStatus(t('common.loading'));
    const error = await verifyCode(email, code);
    setBusy(false);
    if (error) return setStatus(error);
    router.dismissAll();
    router.replace('/');
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
        onChangeText={(v) => {
          setEmail(v);
          setSent(false);
        }}
        autoCapitalize="none"
        autoComplete="email"
        keyboardType="email-address"
        placeholder="name@absoluteracing.net"
        placeholderTextColor={theme.textSecondary}
        onSubmitEditing={send}
        style={inputStyle}
      />
      {sent ? (
        <>
          <ThemedText type="small" themeColor="textSecondary">
            {t('signin.code')}
          </ThemedText>
          <TextInput
            value={code}
            onChangeText={(v) => setCode(v.replace(/\D/g, '').slice(0, 8))}
            autoComplete="one-time-code"
            textContentType="oneTimeCode"
            keyboardType="number-pad"
            placeholder="123456"
            placeholderTextColor={theme.textSecondary}
            onSubmitEditing={verify}
            style={[inputStyle, styles.code]}
          />
          <Button label={t('signin.verify')} icon="log-in-outline" onPress={verify} />
          <Button
            label={t('signin.otherEmail')}
            secondary
            onPress={() => {
              setSent(false);
              setCode('');
              setStatus(null);
            }}
          />
        </>
      ) : (
        <Button label={t('signin.send')} icon="mail-outline" onPress={send} />
      )}
      {status ? (
        <Card>
          <ThemedText type="small">{status}</ThemedText>
        </Card>
      ) : null}
      <ThemedText type="small" themeColor="textSecondary">
        {t('signin.note')}
      </ThemedText>

      {!live ? (
        <>
          <SectionTitle>{t('signin.demo')}</SectionTitle>
          <View style={{ gap: Spacing.three }}>
            <Button label={t('role.crew')} secondary onPress={() => demo('crew')} />
            <Button label={t('role.driver')} secondary onPress={() => demo('driver')} />
          </View>
        </>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  input: { borderWidth: 1, borderRadius: 2, paddingHorizontal: Spacing.three, paddingVertical: 14, fontSize: 16, fontFamily: FontFamily.regular },
  code: { fontSize: 24, letterSpacing: 8, textAlign: 'center' },
});
