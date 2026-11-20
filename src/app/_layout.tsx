import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from 'react-native';

import { Colors } from '@/constants/theme';
import { SessionProvider } from '@/lib/session';

export default function RootLayout() {
  const scheme = useColorScheme() === 'dark' ? 'dark' : 'light';
  const base = scheme === 'dark' ? DarkTheme : DefaultTheme;
  const theme = {
    ...base,
    colors: { ...base.colors, primary: Colors[scheme].tint, background: Colors[scheme].background },
  };

  return (
    <SessionProvider>
      <ThemeProvider value={theme}>
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="event/[id]" options={{ title: 'Event', headerBackTitle: 'Back' }} />
          <Stack.Screen name="chat/[channelId]" options={{ title: 'Chat', headerBackTitle: 'Back' }} />
          <Stack.Screen name="document/[id]" options={{ title: 'Document', headerBackTitle: 'Back' }} />
          <Stack.Screen name="alerts" options={{ title: 'Alerts', headerBackTitle: 'Back' }} />
          <Stack.Screen name="notify" options={{ title: 'Send an alert', presentation: 'modal' }} />
          <Stack.Screen name="travel/[eventId]" options={{ title: 'Travel', headerBackTitle: 'Back' }} />
          <Stack.Screen name="standings" options={{ title: 'Standings', headerBackTitle: 'Back' }} />
          <Stack.Screen name="guide" options={{ title: 'Team guide', headerBackTitle: 'Back' }} />
        </Stack>
        <StatusBar style="auto" />
      </ThemeProvider>
    </SessionProvider>
  );
}
