import { router } from 'expo-router';
import { Pressable, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Card, Icon, Row, Screen, SectionTitle } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { getCar } from '@/data/queries';
import { useTheme } from '@/hooks/use-theme';
import { useSession } from '@/lib/session';
import { isTeam, type Role } from '@/lib/types';

const ROLES: { role: Role; label: string; hint: string }[] = [
  { role: 'management', label: 'Management', hint: 'Everything, plus sending alerts and read receipts' },
  { role: 'driver', label: 'Driver', hint: 'Today dashboard, documents, crew, travel, results' },
  { role: 'sponsor', label: 'Sponsor', hint: 'News and updates on events' },
];

export default function ProfileScreen() {
  const { profile, setRole } = useSession();
  const theme = useTheme();
  const car = getCar(profile.carId);

  return (
    <Screen title="More">
      <Card>
        <Row>
          <Icon name="person-circle" size={48} />
          <View style={{ flex: 1 }}>
            <ThemedText style={{ fontWeight: 700 }}>{profile.name}</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              {profile.jobTitle}
              {car ? ` · Car ${car.number}` : ''}
            </ThemedText>
          </View>
        </Row>
      </Card>

      {isTeam(profile.role) ? (
        <>
          <Card onPress={() => router.push('/guide')}>
            <Row>
              <Icon name="book-outline" size={22} />
              <ThemedText style={{ flex: 1, fontWeight: 600 }}>Team guide</ThemedText>
              <Icon name="chevron-forward" />
            </Row>
          </Card>
          <Card onPress={() => router.push('/alerts')}>
            <Row>
              <Icon name="notifications-outline" size={22} />
              <ThemedText style={{ flex: 1, fontWeight: 600 }}>Alerts</ThemedText>
              <Icon name="chevron-forward" />
            </Row>
          </Card>
        </>
      ) : null}

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
