import { router } from 'expo-router';
import { View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Card, Dot, Icon, Row } from '@/components/ui';
import { describeTarget, getAudience } from '@/data/queries';
import { useTheme } from '@/hooks/use-theme';
import { timeAgo } from '@/lib/format';
import { useSession } from '@/lib/session';
import type { TeamDocument } from '@/lib/types';
import { t } from '@/i18n';

const ICONS = {
  briefing: 'megaphone-outline',
  runplan: 'speedometer-outline',
  timetable: 'time-outline',
  bulletin: 'reader-outline',
  media: 'camera-outline',
  other: 'document-outline',
} as const;

export function DocumentRow({ doc }: { doc: TeamDocument }) {
  const theme = useTheme();
  const { profile, docReads } = useSession();
  const readers = docReads[doc.id] ?? [];
  const isRead = readers.includes(profile.id);
  const audience = getAudience(doc.target);
  const readCount = audience.filter((m) => readers.includes(m.id)).length;
  const category = t(`cat.${doc.category}`);

  return (
    <Card onPress={() => router.push({ pathname: '/document/[id]', params: { id: doc.id } })}>
      <Row>
        <Icon name={ICONS[doc.category]} size={22} />
        <View style={{ flex: 1 }}>
          <ThemedText style={{ fontWeight: isRead ? 500 : 700 }}>{doc.title}</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {category} · {describeTarget(doc.target)} · {timeAgo(doc.publishedAt)}
          </ThemedText>
          {profile.role === 'management' ? (
            <ThemedText type="small" themeColor="textSecondary">
              {t('docs.readBy', { count: readCount, total: audience.length })}
            </ThemedText>
          ) : null}
        </View>
        {!isRead ? <Dot color={theme.tint} /> : null}
      </Row>
    </Card>
  );
}
