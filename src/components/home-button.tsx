import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable } from 'react-native';

import { useTheme } from '@/hooks/use-theme';
import { t } from '@/i18n';

/** Header button on every inner page: jumps straight back to the first screen. */
export function HomeButton() {
  const theme = useTheme();
  return (
    <Pressable
      onPress={() => {
        if (router.canDismiss()) router.dismissAll();
        router.replace('/');
      }}
      accessibilityRole="button"
      accessibilityLabel={t('tab.home')}
      hitSlop={10}
      style={({ pressed }) => ({ paddingHorizontal: 8, opacity: pressed ? 0.6 : 1 })}>
      <Ionicons name="home" size={22} color={theme.tint} />
    </Pressable>
  );
}
