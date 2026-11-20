import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import type { ColorValue } from 'react-native';

import { useTheme } from '@/hooks/use-theme';
import { useSession } from '@/lib/session';
import { isTeam } from '@/lib/types';

type IconName = keyof typeof Ionicons.glyphMap;

const icon =
  (name: IconName) =>
  ({ color, size }: { color: ColorValue; size: number }) => <Ionicons name={name} color={color as string} size={size} />;

export default function TabLayout() {
  const theme = useTheme();
  const { profile } = useSession();
  const team = isTeam(profile.role);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.tint,
        tabBarInactiveTintColor: theme.textSecondary,
        tabBarStyle: { backgroundColor: theme.background, borderTopColor: theme.border },
      }}>
      <Tabs.Screen
        name="index"
        options={{ title: team ? 'Today' : 'Home', tabBarIcon: icon(team ? 'speedometer-outline' : 'home-outline') }}
      />
      <Tabs.Screen name="events" options={{ title: 'Events', tabBarIcon: icon('flag-outline') }} />
      <Tabs.Screen
        name="documents"
        options={{ title: 'Documents', tabBarIcon: icon('folder-open-outline'), href: team ? undefined : null }}
      />
      <Tabs.Screen
        name="messages"
        options={{ title: 'Messages', tabBarIcon: icon('chatbubbles-outline'), href: team ? undefined : null }}
      />
      <Tabs.Screen name="profile" options={{ title: 'More', tabBarIcon: icon('person-circle-outline') }} />
    </Tabs>
  );
}
