import { Ionicons } from '@expo/vector-icons';
import { Redirect, Tabs } from 'expo-router';
import type { ColorValue } from 'react-native';

import { FontFamily } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { getUnreadMessages } from '@/data/queries';
import { useSession } from '@/lib/session';
import { isTeam } from '@/lib/types';
import { t } from '@/i18n';

type IconName = keyof typeof Ionicons.glyphMap;

const icon =
  (name: IconName) =>
  ({ color, size }: { color: ColorValue; size: number }) => <Ionicons name={name} color={color as string} size={size} />;

export default function TabLayout() {
  const theme = useTheme();
  const { profile, entered, channelReadAt } = useSession();
  const unread = getUnreadMessages(profile.role, channelReadAt, profile.name);
  const team = isTeam(profile.role);

  if (!entered) return <Redirect href="/welcome" />;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.tint,
        tabBarInactiveTintColor: theme.textSecondary,
        tabBarStyle: { backgroundColor: theme.background, borderTopColor: theme.border, ...(process.env.EXPO_OS === 'web' ? { height: 66, paddingBottom: 8 } : null) },
        tabBarLabelStyle: { fontFamily: FontFamily.semibold, fontSize: 11, lineHeight: 17 },
      }}>
      <Tabs.Screen
        name="index"
        options={{ title: team ? t('tab.today') : t('tab.home'), tabBarIcon: icon(team ? 'speedometer-outline' : 'home-outline') }}
      />
      <Tabs.Screen name="events" options={{ title: t('tab.season'), tabBarIcon: icon('flag-outline') }} />
      <Tabs.Screen
        name="documents"
        options={{ title: t('tab.documents'), tabBarIcon: icon('folder-open-outline'), href: team ? undefined : null }}
      />
      <Tabs.Screen
        name="messages"
        options={{
          title: t('tab.messages'),
          tabBarIcon: icon('chatbubbles-outline'),
          href: team ? undefined : null,
          tabBarBadge: unread || undefined,
          tabBarBadgeStyle: { backgroundColor: theme.tint, color: '#0B0E14', fontFamily: FontFamily.bold },
        }}
      />
      <Tabs.Screen name="profile" options={{ title: t('tab.more'), tabBarIcon: icon('person-circle-outline') }} />
    </Tabs>
  );
}
