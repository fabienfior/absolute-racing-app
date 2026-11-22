import { Stack, useLocalSearchParams } from 'expo-router';
import { openBrowserAsync } from 'expo-web-browser';
import { useEffect } from 'react';
import { Linking, Platform, Share } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Button, Card, Empty, Icon, Row, Screen, SectionTitle } from '@/components/ui';
import { describeTarget, getAudience, getDocument, getEvent } from '@/data/queries';
import { formatDate, formatTime } from '@/lib/format';
import { useSession } from '@/lib/session';
import { t } from '@/i18n';

export default function DocumentScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { profile, docReads, markDocRead } = useSession();
  const doc = getDocument(id);

  // Opening a document confirms it as read.
  useEffect(() => {
    if (doc) markDocRead(doc.id);
  }, [doc, markDocRead]);

  if (!doc) {
    return (
      <Screen>
        <Empty>{t('docs.notFound')}</Empty>
      </Screen>
    );
  }

  const event = doc.eventId ? getEvent(doc.eventId) : undefined;
  const readers = docReads[doc.id] ?? [];
  const audience = getAudience(doc.target);

  const open = () => (Platform.OS === 'web' ? Linking.openURL(doc.url) : openBrowserAsync(doc.url));

  return (
    <Screen>
      <Stack.Screen options={{ title: t(`cat.${doc.category}`) }} />
      <Card>
        <ThemedText style={{ fontWeight: 700, fontSize: 20 }}>{doc.title}</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          {event ? `${event.name} · ` : ''}{t('docs.for', { target: describeTarget(doc.target) })}
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          {t('docs.published', { date: formatDate(doc.publishedAt), time: formatTime(doc.publishedAt) })}
        </ThemedText>
      </Card>
      <Button label={t('docs.open')} icon="document-text-outline" onPress={open} />
      <Button
        label={t('common.share')}
        icon="share-outline"
        secondary
        onPress={() => Share.share({ message: `${doc.title}\n${doc.url}` }).catch(() => {})}
      />

      {profile.role === 'crew' ? (
        <>
          <SectionTitle>
            {t('docs.readBy', { count: audience.filter((m) => readers.includes(m.id)).length, total: audience.length })}
          </SectionTitle>
          <Card style={{ gap: 8 }}>
            {audience.map((m) => {
              const read = readers.includes(m.id);
              return (
                <Row key={m.id}>
                  <Icon name={read ? 'checkmark-circle' : 'ellipse-outline'} size={20} />
                  <ThemedText type="small" style={{ flex: 1 }}>
                    {m.name}
                  </ThemedText>
                  <ThemedText type="small" themeColor="textSecondary">
                    {read ? t('docs.read') : t('docs.notYet')}
                  </ThemedText>
                </Row>
              );
            })}
          </Card>
        </>
      ) : null}
    </Screen>
  );
}
