import { router } from 'expo-router';
import { View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Button, Card, Empty, Icon, Row, Screen, SectionTitle } from '@/components/ui';
import { folderSubtitle, getEvent, getMedia } from '@/data/queries';
import { t } from '@/i18n';
import { formatDateRange } from '@/lib/format';
import { openLink } from '@/lib/open-link';
import { useSession } from '@/lib/session';

export default function OnboardsScreen() {
  const { profile, folders } = useSession();
  const crew = profile.role === 'management';
  // Drivers see their own car's folders and whole-team folders.
  const visible = folders
    .filter((f) => crew || !f.carId || f.carId === profile.carId)
    .sort((a, b) => {
      const da = (a.eventId && getEvent(a.eventId)?.startDate) || a.createdAt;
      const db = (b.eventId && getEvent(b.eventId)?.startDate) || b.createdAt;
      return db.localeCompare(da) || a.name.localeCompare(b.name);
    });
  const other = getMedia(['onboard', 'video']);

  return (
    <Screen>
      <SectionTitle>{t('onboards.folders')}</SectionTitle>
      {crew ? <Button label={t('onboards.newFolder')} icon="add" onPress={() => router.push('/onboard-folder/new')} /> : null}
      {visible.length ? (
        visible.map((f) => (
          <Card key={f.id} onPress={() => router.push(`/onboard-folder/${f.id}`)}>
            <Row>
              <Icon name="folder" size={30} color="#D5DF22" />
              <View style={{ flex: 1 }}>
                <ThemedText style={{ fontWeight: 700 }}>{f.name}</ThemedText>
                <ThemedText type="small" themeColor="textSecondary">
                  {folderSubtitle(f)}
                </ThemedText>
                <ThemedText type="small" themeColor="textSecondary">
                  {t('onboards.videos', { count: f.videos.length })}
                </ThemedText>
              </View>
              <View accessibilityLabel={t('onboards.openDrive')}>
                <Icon name="open-outline" size={22} onPress={() => openLink(f.driveUrl)} />
              </View>
            </Row>
          </Card>
        ))
      ) : (
        <Empty>{t('onboards.noFolders')}</Empty>
      )}

      {other.length ? (
        <>
          <SectionTitle>{t('onboards.otherVideos')}</SectionTitle>
          {other.map((m) => (
            <Card key={m.event.id + m.label} onPress={() => openLink(m.url)}>
              <Row>
                <Icon name={m.kind === 'onboard' ? 'videocam' : 'play-circle'} size={26} />
                <View style={{ flex: 1 }}>
                  <ThemedText style={{ fontWeight: 700 }}>{m.label}</ThemedText>
                  <ThemedText type="small" themeColor="textSecondary">
                    {m.event.name} · {formatDateRange(m.event.startDate, m.event.endDate)}
                  </ThemedText>
                </View>
              </Row>
            </Card>
          ))}
        </>
      ) : null}
    </Screen>
  );
}
