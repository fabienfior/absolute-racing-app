import { router } from 'expo-router';

import { EventCard } from '@/components/event-card';
import { ThemedText } from '@/components/themed-text';
import { Card, Empty, Screen, SectionTitle } from '@/components/ui';
import { getCurrentOrNextEvent, getNews } from '@/data/queries';
import { formatDate } from '@/lib/format';
import { useSession } from '@/lib/session';
import { t } from '@/i18n';

export function SponsorHome() {
  const { profile } = useSession();
  const next = getCurrentOrNextEvent();
  const news = getNews(profile.role);

  return (
    <Screen logo home>
      <SectionTitle>{t('home.nextEvent')}</SectionTitle>
      {next ? <EventCard event={next} highlight={t('home.upNext')} /> : <Empty>{t('home.noUpcoming')}</Empty>}

      <SectionTitle>{t('home.latestNews')}</SectionTitle>
      {news.map((post) => (
        <Card
          key={post.id}
          onPress={
            post.eventId ? () => router.push({ pathname: '/event/[id]', params: { id: post.eventId! } }) : undefined
          }>
          <ThemedText type="small" themeColor="textSecondary">
            {formatDate(post.publishedAt)}
          </ThemedText>
          <ThemedText style={{ fontWeight: 700 }}>{post.title}</ThemedText>
          <ThemedText type="small">{post.body}</ThemedText>
        </Card>
      ))}
    </Screen>
  );
}
