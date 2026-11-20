import { Stack, useLocalSearchParams } from 'expo-router';
import { View } from 'react-native';

import { ExternalLink } from '@/components/external-link';
import { ThemedText } from '@/components/themed-text';
import { Card, Empty, Icon, Screen, SectionTitle } from '@/components/ui';
import { getEvent } from '@/data/queries';
import { formatDateRange } from '@/lib/format';
import { useSession } from '@/lib/session';
import { isTeam, type MediaLink, type TravelItem } from '@/lib/types';

const travelIcon: Record<TravelItem['kind'], 'airplane-outline' | 'bed-outline' | 'car-outline' | 'ellipse-outline'> = {
  flight: 'airplane-outline',
  hotel: 'bed-outline',
  transfer: 'car-outline',
  other: 'ellipse-outline',
};

const linkIcon: Record<MediaLink['kind'], 'stats-chart-outline' | 'play-circle-outline' | 'videocam-outline' | 'link-outline'> = {
  results: 'stats-chart-outline',
  video: 'play-circle-outline',
  onboard: 'videocam-outline',
  other: 'link-outline',
};

export default function EventScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { profile } = useSession();
  const event = getEvent(id);

  if (!event) {
    return (
      <Screen>
        <Empty>Event not found.</Empty>
      </Screen>
    );
  }

  const team = isTeam(profile.role);
  const days = [...new Set(event.timetable.map((t) => t.day))];

  return (
    <Screen>
      <Stack.Screen options={{ title: event.name }} />
      <Card>
        <ThemedText type="default" style={{ fontWeight: 700, fontSize: 20 }}>
          {event.name}
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          {event.circuit} · {event.location}
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          {formatDateRange(event.startDate, event.endDate)}
        </ThemedText>
        <ThemedText type="small" style={{ marginTop: 8 }}>
          {event.summary}
        </ThemedText>
      </Card>

      <SectionTitle>Results, videos and onboard</SectionTitle>
      {event.links.length ? (
        event.links.map((l) => (
          <ExternalLink key={l.url + l.label} href={l.url as `https://${string}`} asChild>
            <Card style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <Icon name={linkIcon[l.kind]} size={22} />
              <ThemedText style={{ fontWeight: 600 }}>{l.label}</ThemedText>
            </Card>
          </ExternalLink>
        ))
      ) : (
        <Empty>Links will appear here after the event.</Empty>
      )}

      <SectionTitle>Timetable</SectionTitle>
      {days.length ? (
        days.map((day) => (
          <Card key={day}>
            <ThemedText type="smallBold">{day}</ThemedText>
            {event.timetable
              .filter((t) => t.day === day)
              .map((t) => (
                <View key={t.time + t.title} style={{ flexDirection: 'row', gap: 12 }}>
                  <ThemedText type="small" themeColor="textSecondary" style={{ width: 48 }}>
                    {t.time}
                  </ThemedText>
                  <ThemedText type="small">{t.title}</ThemedText>
                </View>
              ))}
          </Card>
        ))
      ) : (
        <Empty>Timetable not published yet.</Empty>
      )}

      {team ? (
        <>
          <SectionTitle>Travel plan (team only)</SectionTitle>
          {event.travel.length ? (
            event.travel.map((t) => (
              <Card key={t.title} style={{ flexDirection: 'row', gap: 12 }}>
                <Icon name={travelIcon[t.kind]} size={22} />
                <View style={{ flex: 1 }}>
                  <ThemedText style={{ fontWeight: 600 }}>{t.title}</ThemedText>
                  <ThemedText type="small" themeColor="textSecondary">
                    {t.when} · {t.details}
                  </ThemedText>
                </View>
              </Card>
            ))
          ) : (
            <Empty>Travel plan coming soon.</Empty>
          )}
        </>
      ) : null}
    </Screen>
  );
}
