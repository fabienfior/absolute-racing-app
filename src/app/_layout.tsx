import { Saira_400Regular } from '@expo-google-fonts/saira/400Regular';
import { Saira_500Medium } from '@expo-google-fonts/saira/500Medium';
import { Saira_600SemiBold } from '@expo-google-fonts/saira/600SemiBold';
import { Saira_700Bold } from '@expo-google-fonts/saira/700Bold';
import { Saira_800ExtraBold } from '@expo-google-fonts/saira/800ExtraBold';
import { Saira_900Black } from '@expo-google-fonts/saira/900Black';
import { useFonts } from 'expo-font';
import { DarkTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';

import { Colors, FontFamily } from '@/constants/theme';
import { LanguageProvider } from '@/i18n';
import { SessionProvider } from '@/lib/session';
import { t } from '@/i18n';

SplashScreen.preventAutoHideAsync().catch(() => {});

const c = Colors.dark;
const theme = {
  ...DarkTheme,
  colors: { ...DarkTheme.colors, primary: c.tint, background: c.background, card: c.background, border: c.border, text: c.text },
  fonts: {
    regular: { fontFamily: FontFamily.regular, fontWeight: 'normal' as const },
    medium: { fontFamily: FontFamily.semibold, fontWeight: 'normal' as const },
    bold: { fontFamily: FontFamily.bold, fontWeight: 'normal' as const },
    heavy: { fontFamily: FontFamily.extrabold, fontWeight: 'normal' as const },
  },
};

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Saira_400Regular,
    Saira_500Medium,
    Saira_600SemiBold,
    Saira_700Bold,
    Saira_800ExtraBold,
    Saira_900Black,
  });
  const ready = fontsLoaded || !!fontError;
  useEffect(() => {
    if (ready) SplashScreen.hideAsync().catch(() => {});
  }, [ready]);
  if (!ready) return null;

  return (
    <LanguageProvider>
      {(language) => (
        <SessionProvider>
          <ThemeProvider value={theme}>
            {/* Remount on language change so every label re-renders. */}
            <Stack key={language} screenOptions={{ headerTitleStyle: { fontFamily: FontFamily.bold }, headerTintColor: c.text }}>
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              <Stack.Screen name="welcome" options={{ headerShown: false, animation: 'fade' }} />
              <Stack.Screen name="sign-in" options={{ title: t('signin.title'), headerBackTitle: t('common.back') }} />
              <Stack.Screen name="event/[id]" options={{ title: t('title.event'), headerBackTitle: t('common.back') }} />
              <Stack.Screen name="chat/[channelId]" options={{ title: t('title.chat'), headerBackTitle: t('common.back') }} />
              <Stack.Screen name="document/[id]" options={{ title: t('title.document'), headerBackTitle: t('common.back') }} />
              <Stack.Screen name="alerts" options={{ title: t('title.alerts'), headerBackTitle: t('common.back') }} />
              <Stack.Screen name="notify" options={{ title: t('title.sendAlert'), presentation: 'modal' }} />
              <Stack.Screen name="travel/[eventId]" options={{ title: t('title.travel'), headerBackTitle: t('common.back') }} />
              <Stack.Screen name="standings" options={{ title: t('title.standings'), headerBackTitle: t('common.back') }} />
              <Stack.Screen name="guide" options={{ title: t('title.guide'), headerBackTitle: t('common.back') }} />
            </Stack>
            <StatusBar style="light" />
          </ThemeProvider>
        </SessionProvider>
      )}
    </LanguageProvider>
  );
}
