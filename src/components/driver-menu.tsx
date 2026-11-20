import { Ionicons } from '@expo/vector-icons';
import { router, type Href } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Brand, Spacing } from '@/constants/theme';
import { getDocuments, getUnreadMessages } from '@/data/queries';
import { useTheme } from '@/hooks/use-theme';
import { t } from '@/i18n';
import { useSession } from '@/lib/session';

function Tile({
  icon,
  label,
  href,
  badge,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  href: Href;
  badge?: number;
}) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={() => router.push(href)}
      accessibilityLabel={badge ? `${label}, ${t('menu.new', { count: badge })}` : label}
      style={({ pressed }) => [
        styles.tile,
        { backgroundColor: theme.backgroundElement, borderColor: badge ? theme.tint : theme.border, opacity: pressed ? 0.75 : 1 },
      ]}>
      <Ionicons name={icon} size={30} color={theme.tint} />
      <ThemedText style={{ fontWeight: 800, fontSize: 16, lineHeight: 20, textTransform: 'uppercase' }}>{label}</ThemedText>
      {badge ? (
        <View style={[styles.badge, { backgroundColor: theme.tint }]}>
          <ThemedText style={{ color: Brand.primaryText, fontWeight: 800, fontSize: 12, lineHeight: 16 }}>
            {t('menu.new', { count: badge })}
          </ThemedText>
        </View>
      ) : null}
    </Pressable>
  );
}

/** Quick-access menu for drivers: onboards, results, messages (with unread count) and documents. */
export function DriverMenu() {
  const { profile, channelReadAt, docReads } = useSession();
  const unreadMessages = getUnreadMessages(profile.role, channelReadAt, profile.name);
  const unreadDocs = getDocuments(profile).filter((d) => !(docReads[d.id] ?? []).includes(profile.id)).length;

  return (
    <View style={styles.grid}>
      <Tile icon="videocam-outline" label={t('menu.onboards')} href="/onboards" />
      <Tile icon="trophy-outline" label={t('menu.results')} href="/results" />
      <Tile icon="chatbubbles-outline" label={t('menu.messages')} href="/messages" badge={unreadMessages} />
      <Tile icon="folder-open-outline" label={t('menu.documents')} href="/documents" badge={unreadDocs} />
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.three },
  tile: {
    flexGrow: 1,
    flexBasis: '40%',
    minHeight: 112,
    borderWidth: 1,
    borderRadius: 2,
    padding: Spacing.three,
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  badge: {
    position: 'absolute',
    top: Spacing.three,
    right: Spacing.three,
    paddingHorizontal: 8,
    paddingVertical: 2,
    transform: [{ skewX: '-12deg' }],
  },
});
