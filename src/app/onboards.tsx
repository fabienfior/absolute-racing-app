import { useState } from 'react';
import { View } from 'react-native';

import { ExternalLink } from '@/components/external-link';
import { ThemedText } from '@/components/themed-text';
import { Card, Chip, Empty, Icon, Row, Screen } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { getMedia } from '@/data/queries';
import { t } from '@/i18n';
import { formatDateRange } from '@/lib/format';

export default function OnboardsScreen() {
  const [kind, setKind] = useState<'all' | 'onboard' | 'video'>('all');
  const media = getMedia(kind === 'all' ? ['onboard', 'video'] : [kind]);

  return (
    <Screen>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two }}>
        <Chip label={t('common.all')} active={kind === 'all'} onPress={() => setKind('all')} />
        <Chip label={t('onboards.onboard')} active={kind === 'onboard'} onPress={() => setKind('onboard')} />
        <Chip label={t('onboards.video')} active={kind === 'video'} onPress={() => setKind('video')} />
      </View>
      {media.length ? (
        media.map((m) => (
          <ExternalLink key={m.event.id + m.label} href={m.url as `https://${string}`} asChild>
            <Card>
              <Row>
                <Icon name={m.kind === 'onboard' ? 'videocam' : 'play-circle'} size={30} />
                <View style={{ flex: 1 }}>
                  <ThemedText style={{ fontWeight: 700 }}>{m.label}</ThemedText>
                  <ThemedText type="small" themeColor="textSecondary">
                    {m.event.name} · {formatDateRange(m.event.startDate, m.event.endDate)}
                  </ThemedText>
                </View>
              </Row>
            </Card>
          </ExternalLink>
        ))
      ) : (
        <Empty>{t('onboards.empty')}</Empty>
      )}
    </Screen>
  );
}
