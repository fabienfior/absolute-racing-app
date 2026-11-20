import { router } from 'expo-router';

import { EventCard } from '@/components/event-card';
import { ThemedText } from '@/components/themed-text';
import { Card, Empty, Screen, SectionTitle } from '@/components/ui';
import { getNews, getUpcomingEvents } from '@/data/queries';
import { formatDate } from '@/lib/format';
import { useSession } from '@/lib/session';

export default function HomeScreen() {
  const { profile } = useSession();
  const next = getUpcomingEvents()[0];
  const news = getNews(profile.role);

  return (
    <Screen title="Absolute Racing">
      <ThemedText type="small" themeColor="textSecondary">
        Welcome, {profile.fullName}
      </ThemedText>

      <SectionTitle>Next event</SectionTitle>
      {next ? <EventCard event={next} highlight="Up next" /> : <Empty>No upcoming events yet.</Empty>}

      <SectionTitle>Latest news</SectionTitle>
      {news.map((post) => (
        <Card
          key={post.id}
          onPress={
            post.eventId
              ? () => router.push({ pathname: '/event/[id]', params: { id: post.eventId! } })
              : undefined
          }>
          <ThemedText type="small" themeColor="textSecondary">
            {formatDate(post.publishedAt)}
            {post.audience === 'team' ? ' · Team only' : ''}
          </ThemedText>
          <ThemedText style={{ fontWeight: 700 }}>{post.title}</ThemedText>
          <ThemedText type="small">{post.body}</ThemedText>
        </Card>
      ))}
    </Screen>
  );
}
