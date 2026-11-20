import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import type { ComponentProps, ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, View, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { Brand, MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

/** Brand angle used on buttons and tags, like the slanted shapes on absoluteracing.net. */
const SLANT = '-12deg';

export function Logo({ height = 34 }: { height?: number }) {
  return (
    <Image
      source={require('@/assets/images/logo.png')}
      style={{ height, width: (height * 540) / 132 }}
      contentFit="contain"
      accessibilityLabel="Absolute Racing"
    />
  );
}

export function Screen({
  children,
  title,
  right,
  logo,
}: {
  children: ReactNode;
  title?: string;
  right?: ReactNode;
  logo?: boolean;
}) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const top = title || logo;
  return (
    <ScrollView
      style={{ backgroundColor: theme.background }}
      contentContainerStyle={[styles.screen, { paddingTop: top ? insets.top + Spacing.three : Spacing.three }]}>
      <View style={styles.inner}>
        {logo ? (
          <View style={styles.titleRow}>
            <View style={{ flex: 1 }}>
              <Logo />
            </View>
            {right}
          </View>
        ) : null}
        {title ? (
          <View style={styles.titleRow}>
            <ThemedText type="subtitle" style={{ flex: 1 }}>
              {title}
            </ThemedText>
            {logo ? null : right}
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
  accent,
}: {
  children: ReactNode;
  onPress?: () => void;
  style?: ViewStyle;
  accent?: boolean;
}) {
  const theme = useTheme();
  const content = (
    <View
      style={[
        styles.card,
        { backgroundColor: theme.backgroundElement, borderColor: theme.border },
        accent && { borderLeftColor: theme.tint, borderLeftWidth: 3 },
        style,
      ]}>
      {children}
    </View>
  );
  if (!onPress) return content;
  return (
    <Pressable onPress={onPress} style={({ pressed }) => pressed && { opacity: 0.75 }}>
      {content}
    </Pressable>
  );
}

export function Row({ children, style }: { children: ReactNode; style?: ViewStyle }) {
  return <View style={[{ flexDirection: 'row', alignItems: 'center', gap: Spacing.two }, style]}>{children}</View>;
}

/** Small uppercase lime label with a leading rule, as on the website. */
export function SectionTitle({ children, right }: { children: ReactNode; right?: ReactNode }) {
  const theme = useTheme();
  return (
    <Row style={{ marginTop: Spacing.three, justifyContent: 'space-between' }}>
      <Row style={{ flexShrink: 1 }}>
        <View style={{ width: 22, height: 2, backgroundColor: theme.tint }} />
        <ThemedText type="label" style={{ flexShrink: 1 }}>
          {children}
        </ThemedText>
      </Row>
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
    <View
      style={[
        styles.pill,
        muted
          ? { backgroundColor: 'transparent', borderWidth: 1, borderColor: theme.border }
          : { backgroundColor: theme.tint },
      ]}>
      <ThemedText
        type="label"
        style={{ color: muted ? theme.textSecondary : Brand.primaryText, fontSize: 11, lineHeight: 14, transform: [{ skewX: '12deg' }] }}>
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
        active ? { backgroundColor: theme.tint, borderColor: theme.tint } : { borderColor: theme.border },
      ]}>
      <ThemedText
        type="label"
        style={{ color: active ? Brand.primaryText : theme.text, fontSize: 12, transform: [{ skewX: '12deg' }] }}>
        {label}
      </ThemedText>
    </Pressable>
  );
}

export function Button({
  label,
  icon,
  onPress,
  secondary,
}: {
  label: string;
  icon?: ComponentProps<typeof Ionicons>['name'];
  onPress: () => void;
  secondary?: boolean;
}) {
  const theme = useTheme();
  const fg = secondary ? theme.text : Brand.primaryText;
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        secondary
          ? { backgroundColor: 'transparent', borderWidth: 1, borderColor: theme.border }
          : { backgroundColor: theme.tint },
        { opacity: pressed ? 0.8 : 1 },
      ]}>
      <View style={styles.buttonInner}>
        {icon ? <Ionicons name={icon} size={18} color={secondary ? theme.tint : fg} /> : null}
        <ThemedText type="label" style={{ color: fg, fontSize: 14 }}>
          {label}
        </ThemedText>
      </View>
    </Pressable>
  );
}

export function Dot({ color }: { color: string }) {
  return <View style={{ width: 8, height: 8, backgroundColor: color, transform: [{ rotate: '45deg' }] }} />;
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
  card: { borderRadius: 2, borderWidth: 1, padding: Spacing.three, gap: Spacing.one },
  pill: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 3, transform: [{ skewX: SLANT }] },
  chip: { paddingHorizontal: 14, paddingVertical: 7, borderWidth: 1, transform: [{ skewX: SLANT }] },
  button: { transform: [{ skewX: SLANT }], marginHorizontal: 6 },
  buttonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    paddingVertical: 14,
    paddingHorizontal: Spacing.four,
    transform: [{ skewX: '12deg' }],
  },
});
