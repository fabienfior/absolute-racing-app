import { Stack, useLocalSearchParams } from 'expo-router';
import { openBrowserAsync } from 'expo-web-browser';
import { useEffect } from 'react';
import { Linking, Platform, Share } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Button, Card, Empty, Icon, Row, Screen, SectionTitle } from '@/components/ui';
import { describeTarget, getAudience, getDocument, getEvent } from '@/data/queries';
import { formatDate, formatTime } from '@/lib/format';
import { useSession } from '@/lib/session';
import { DOC_CATEGORIES } from '@/lib/types';

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
        <Empty>Document not found.</Empty>
      </Screen>
    );
  }

  const event = doc.eventId ? getEvent(doc.eventId) : undefined;
  const readers = docReads[doc.id] ?? [];
  const audience = getAudience(doc.target);

  const open = () => (Platform.OS === 'web' ? Linking.openURL(doc.url) : openBrowserAsync(doc.url));

  return (
    <Screen>
      <Stack.Screen options={{ title: DOC_CATEGORIES.find((c) => c.id === doc.category)?.label ?? 'Document' }} />
      <Card>
        <ThemedText style={{ fontWeight: 700, fontSize: 20 }}>{doc.title}</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          {event ? `${event.name} · ` : ''}For {describeTarget(doc.target).toLowerCase()}
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          Published {formatDate(doc.publishedAt)} at {formatTime(doc.publishedAt)}
        </ThemedText>
      </Card>
      <Button label="Open document" icon="document-text-outline" onPress={open} />
      <Button
        label="Share"
        icon="share-outline"
        secondary
        onPress={() => Share.share({ message: `${doc.title}\n${doc.url}` }).catch(() => {})}
      />

      {profile.role === 'management' ? (
        <>
          <SectionTitle>
            Read by {audience.filter((m) => readers.includes(m.id)).length} of {audience.length}
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
                    {read ? 'Read' : 'Not yet'}
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
