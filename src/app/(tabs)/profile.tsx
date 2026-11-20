import { Pressable, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Card, Screen, SectionTitle } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useSession } from '@/lib/session';
import type { Role } from '@/lib/types';

const ROLES: { role: Role; label: string; hint: string }[] = [
  { role: 'management', label: 'Management', hint: 'Everything: travel, timetable, guide, messages' },
  { role: 'driver', label: 'Driver', hint: 'Team info, results, videos and onboard' },
  { role: 'sponsor', label: 'Sponsor', hint: 'News and updates on events' },
];

export default function ProfileScreen() {
  const { profile, setRole } = useSession();
  const theme = useTheme();

  return (
    <Screen title="Profile">
      <Card>
        <ThemedText style={{ fontWeight: 700 }}>{profile.fullName}</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          Signed in as {profile.role}
        </ThemedText>
      </Card>

      <SectionTitle>Preview as (demo only)</SectionTitle>
      <View style={{ gap: Spacing.two }}>
        {ROLES.map((r) => {
          const active = r.role === profile.role;
          return (
            <Pressable key={r.role} onPress={() => setRole(r.role)}>
              <Card style={{ borderWidth: 2, borderColor: active ? theme.tint : 'transparent' }}>
                <ThemedText style={{ fontWeight: 700 }}>{r.label}</ThemedText>
                <ThemedText type="small" themeColor="textSecondary">
                  {r.hint}
                </ThemedText>
              </Card>
            </Pressable>
          );
        })}
      </View>
    </Screen>
  );
}
