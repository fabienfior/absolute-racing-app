import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from 'react-native';

import { Colors } from '@/constants/theme';
import { LanguageProvider } from '@/i18n';
import { SessionProvider } from '@/lib/session';
import { t } from '@/i18n';

export default function RootLayout() {
  const scheme = useColorScheme() === 'dark' ? 'dark' : 'light';
  const base = scheme === 'dark' ? DarkTheme : DefaultTheme;
  const theme = {
    ...base,
    colors: { ...base.colors, primary: Colors[scheme].tint, background: Colors[scheme].background },
  };

  return (
    <LanguageProvider>
      {(language) => (
        <SessionProvider>
          <ThemeProvider value={theme}>
            {/* Remount on language change so every label re-renders. */}
            <Stack key={language}>
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              <Stack.Screen name="event/[id]" options={{ title: t('title.event'), headerBackTitle: t('common.back') }} />
              <Stack.Screen name="chat/[channelId]" options={{ title: t('title.chat'), headerBackTitle: t('common.back') }} />
              <Stack.Screen name="document/[id]" options={{ title: t('title.document'), headerBackTitle: t('common.back') }} />
              <Stack.Screen name="alerts" options={{ title: t('title.alerts'), headerBackTitle: t('common.back') }} />
              <Stack.Screen name="notify" options={{ title: t('title.sendAlert'), presentation: 'modal' }} />
              <Stack.Screen name="travel/[eventId]" options={{ title: t('title.travel'), headerBackTitle: t('common.back') }} />
              <Stack.Screen name="standings" options={{ title: t('title.standings'), headerBackTitle: t('common.back') }} />
              <Stack.Screen name="guide" options={{ title: t('title.guide'), headerBackTitle: t('common.back') }} />
            </Stack>
            <StatusBar style="auto" />
          </ThemeProvider>
        </SessionProvider>
      )}
    </LanguageProvider>
  );
}
