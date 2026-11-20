import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps, ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, View, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export function Screen({ children, title, right }: { children: ReactNode; title?: string; right?: ReactNode }) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <ScrollView
      style={{ backgroundColor: theme.background }}
      contentContainerStyle={[styles.screen, { paddingTop: title ? insets.top + Spacing.three : Spacing.three }]}>
      <View style={styles.inner}>
        {title ? (
          <View style={styles.titleRow}>
            <ThemedText type="subtitle" style={{ flex: 1 }}>
              {title}
            </ThemedText>
            {right}
          </View>
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

export function Row({ children, style }: { children: ReactNode; style?: ViewStyle }) {
  return <View style={[{ flexDirection: 'row', alignItems: 'center', gap: Spacing.two }, style]}>{children}</View>;
}

export function SectionTitle({ children, right }: { children: ReactNode; right?: ReactNode }) {
  return (
    <Row style={{ marginTop: Spacing.two, justifyContent: 'space-between' }}>
      <ThemedText type="smallBold" themeColor="textSecondary" style={styles.section}>
        {children}
      </ThemedText>
      {right}
    </Row>
  );
}

export function Icon(props: ComponentProps<typeof Ionicons>) {
  const theme = useTheme();
  return <Ionicons color={theme.text} size={18} {...props} />;
}

export function Pill({ label, muted }: { label: string; muted?: boolean }) {
  const theme = useTheme();
  return (
    <View style={[styles.pill, { backgroundColor: muted ? theme.backgroundSelected : theme.tint }]}>
      <ThemedText
        type="smallBold"
        style={{ color: muted ? theme.text : '#fff', fontSize: 12, lineHeight: 16 }}>
        {label}
      </ThemedText>
    </View>
  );
}

export function Chip({ label, active, onPress }: { label: string; active?: boolean; onPress: () => void }) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.chip,
        { backgroundColor: active ? theme.tint : theme.backgroundElement },
      ]}>
      <ThemedText type="smallBold" style={{ color: active ? '#fff' : theme.text }}>
        {label}
      </ThemedText>
    </Pressable>
  );
}

export function Button({ label, icon, onPress, secondary }: { label: string; icon?: ComponentProps<typeof Ionicons>['name']; onPress: () => void; secondary?: boolean }) {
  const theme = useTheme();
  const fg = secondary ? theme.text : '#fff';
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: secondary ? theme.backgroundElement : theme.tint, opacity: pressed ? 0.8 : 1 },
      ]}>
      {icon ? <Ionicons name={icon} size={18} color={fg} /> : null}
      <ThemedText type="smallBold" style={{ color: fg, fontSize: 15 }}>
        {label}
      </ThemedText>
    </Pressable>
  );
}

export function Dot({ color }: { color: string }) {
  return <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: color }} />;
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
  titleRow: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.one },
  card: { borderRadius: 14, padding: Spacing.three, gap: Spacing.one },
  section: { textTransform: 'uppercase', letterSpacing: 0.6 },
  pill: { alignSelf: 'flex-start', paddingHorizontal: Spacing.two, paddingVertical: 2, borderRadius: 99 },
  chip: { paddingHorizontal: Spacing.three, paddingVertical: 6, borderRadius: 99 },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    paddingVertical: 12,
    paddingHorizontal: Spacing.three,
    borderRadius: 12,
  },
});
