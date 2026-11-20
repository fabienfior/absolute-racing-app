import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps, ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, View, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export function Screen({ children, title }: { children: ReactNode; title?: string }) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <ScrollView
      style={{ backgroundColor: theme.background }}
      contentContainerStyle={[styles.screen, { paddingTop: title ? insets.top + Spacing.three : Spacing.three }]}>
      <View style={styles.inner}>
        {title ? (
          <ThemedText type="subtitle" style={styles.title}>
            {title}
          </ThemedText>
        ) : null}
        {children}
      </View>
    </ScrollView>
  );
}

export function Card({
  children,
  onPress,
  style,
}: {
  children: ReactNode;
  onPress?: () => void;
  style?: ViewStyle;
}) {
  const theme = useTheme();
  const content = (
    <View style={[styles.card, { backgroundColor: theme.backgroundElement }, style]}>{children}</View>
  );
  if (!onPress) return content;
  return (
    <Pressable onPress={onPress} style={({ pressed }) => pressed && { opacity: 0.7 }}>
      {content}
    </Pressable>
  );
}

export function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <ThemedText type="smallBold" themeColor="textSecondary" style={styles.section}>
      {children}
    </ThemedText>
  );
}

export function Icon(props: ComponentProps<typeof Ionicons>) {
  const theme = useTheme();
  return <Ionicons color={theme.text} size={18} {...props} />;
}

export function Pill({ label }: { label: string }) {
  const theme = useTheme();
  return (
    <View style={[styles.pill, { backgroundColor: theme.tint }]}>
      <ThemedText type="smallBold" style={{ color: '#fff', fontSize: 12, lineHeight: 16 }}>
        {label}
      </ThemedText>
    </View>
  );
}

export function Empty({ children }: { children: ReactNode }) {
  return (
    <ThemedText type="small" themeColor="textSecondary" style={{ paddingVertical: Spacing.two }}>
      {children}
    </ThemedText>
  );
}

const styles = StyleSheet.create({
  screen: { paddingHorizontal: Spacing.three, paddingBottom: Spacing.six },
  inner: { width: '100%', maxWidth: MaxContentWidth, alignSelf: 'center', gap: Spacing.three },
  title: { marginBottom: Spacing.one },
  card: { borderRadius: 14, padding: Spacing.three, gap: Spacing.one },
  section: { textTransform: 'uppercase', letterSpacing: 0.6, marginTop: Spacing.two },
  pill: { alignSelf: 'flex-start', paddingHorizontal: Spacing.two, paddingVertical: 2, borderRadius: 99 },
});
