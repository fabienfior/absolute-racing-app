import { router } from 'expo-router';
import { Pressable, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Card, Chip, Icon, Row, Screen, SectionTitle } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { getCar } from '@/data/queries';
import { useTheme } from '@/hooks/use-theme';
import { useSession } from '@/lib/session';
import { isTeam, type Role } from '@/lib/types';
import { LANGUAGES, t, useLanguage } from '@/i18n';

const ROLES: Role[] = ['management', 'driver', 'sponsor'];

export default function ProfileScreen() {
  const { profile, setRole } = useSession();
  const theme = useTheme();
  const car = getCar(profile.carId);
  const { language, setLanguage } = useLanguage();

  return (
    <Screen title={t('more.title')}>
      <Card>
        <Row>
          <Icon name="person-circle" size={48} />
          <View style={{ flex: 1 }}>
            <ThemedText style={{ fontWeight: 700 }}>{profile.name}</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              {profile.jobTitle}
              {car ? ` · ${t('today.car', { number: car.number })}` : ''}
            </ThemedText>
          </View>
        </Row>
      </Card>

      {isTeam(profile.role) ? (
        <>
          <Card onPress={() => router.push('/guide')}>
            <Row>
              <Icon name="book-outline" size={22} />
              <ThemedText style={{ flex: 1, fontWeight: 600 }}>{t('title.guide')}</ThemedText>
              <Icon name="chevron-forward" />
            </Row>
          </Card>
          <Card onPress={() => router.push('/alerts')}>
            <Row>
              <Icon name="notifications-outline" size={22} />
              <ThemedText style={{ flex: 1, fontWeight: 600 }}>{t('title.alerts')}</ThemedText>
              <Icon name="chevron-forward" />
            </Row>
          </Card>
        </>
      ) : null}

      <SectionTitle>{t('more.language')}</SectionTitle>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two }}>
        {LANGUAGES.map((l) => (
          <Chip key={l.id} label={l.name} active={language === l.id} onPress={() => setLanguage(l.id)} />
        ))}
      </View>

      <SectionTitle>{t('more.previewAs')}</SectionTitle>
      <View style={{ gap: Spacing.two }}>
        {ROLES.map((r) => {
          const active = r === profile.role;
          return (
            <Pressable key={r} onPress={() => setRole(r)}>
              <Card style={{ borderWidth: 2, borderColor: active ? theme.tint : 'transparent' }}>
                <ThemedText style={{ fontWeight: 700 }}>{t(`role.${r}`)}</ThemedText>
                <ThemedText type="small" themeColor="textSecondary">
                  {t(`role.${r}Hint`)}
                </ThemedText>
              </Card>
            </Pressable>
          );
        })}
      </View>
    </Screen>
  );
}
