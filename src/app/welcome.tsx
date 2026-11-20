import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { t } from '@/i18n';
import { useSession } from '@/lib/session';

function Choice({
  icon,
  title,
  hint,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  hint: string;
  onPress: () => void;
}) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.choice,
        { backgroundColor: theme.backgroundElement, borderColor: pressed ? theme.tint : theme.border },
      ]}>
      <View style={[styles.choiceIcon, { borderColor: theme.tint }]}>
        <Ionicons name={icon} size={24} color={theme.tint} style={{ transform: [{ skewX: '12deg' }] }} />
      </View>
      <View style={{ flex: 1, gap: 2 }}>
        <ThemedText style={{ fontWeight: 900, fontSize: 20, lineHeight: 24, textTransform: 'uppercase' }}>{title}</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          {hint}
        </ThemedText>
      </View>
      <Ionicons name="chevron-forward" size={20} color={theme.textSecondary} />
    </Pressable>
  );
}

export default function WelcomeScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { enter } = useSession();

  return (
    <View style={[styles.screen, { backgroundColor: theme.background, paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <View style={styles.inner}>
        <View style={styles.brand}>
          <View style={[styles.markWrap, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
            <Image source={require('@/assets/images/mark.png')} style={styles.mark} contentFit="contain" accessibilityLabel="Absolute Racing" />
          </View>
          <ThemedText style={styles.name}>Absolute Racing</ThemedText>
          <View style={styles.taglineRow}>
            <View style={{ width: 22, height: 2, backgroundColor: theme.tint }} />
            <ThemedText type="label">{t('welcome.tagline')}</ThemedText>
            <View style={{ width: 22, height: 2, backgroundColor: theme.tint }} />
          </View>
        </View>

        <View style={{ gap: Spacing.three }}>
          <Choice icon="people-outline" title={t('welcome.team')} hint={t('welcome.teamHint')} onPress={() => router.push('/sign-in')} />
          <Choice
            icon="flag-outline"
            title={t('welcome.guest')}
            hint={t('welcome.guestHint')}
            onPress={() => {
              enter('guest');
              router.replace('/');
            }}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, justifyContent: 'center', paddingHorizontal: Spacing.three },
  inner: { width: '100%', maxWidth: MaxContentWidth / 1.6, alignSelf: 'center', gap: Spacing.five },
  brand: { alignItems: 'center', gap: Spacing.two },
  markWrap: { width: 132, height: 132, borderRadius: 66, borderWidth: 1, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.two },
  mark: { width: 96, height: 96 },
  name: { fontWeight: 900, fontSize: 36, lineHeight: 40, textTransform: 'uppercase', textAlign: 'center' },
  taglineRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  choice: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three, padding: Spacing.three, borderWidth: 1, borderRadius: 2 },
  choiceIcon: { width: 52, height: 52, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center', transform: [{ skewX: '-12deg' }] },
});
