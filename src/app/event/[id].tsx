import { Ionicons } from '@expo/vector-icons';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { Linking, View } from 'react-native';

import { DocumentRow } from '@/components/document-row';
import { ExternalLink } from '@/components/external-link';
import { ThemedText } from '@/components/themed-text';
import { TravelRow } from '@/components/travel-row';
import { Button, Card, Empty, Icon, Row, Screen, SectionTitle } from '@/components/ui';
import { getCar, getChampionship, getDocuments, getEvent, getMember, getMySessions, getTravel } from '@/data/queries';
import { formatDateRange, formatDay, formatTime } from '@/lib/format';
import { useSession } from '@/lib/session';
import { isTeam, type MediaLink } from '@/lib/types';

type IconName = keyof typeof Ionicons.glyphMap;

const linkIcon: Record<MediaLink['kind'], IconName> = {
  results: 'trophy-outline',
  livetiming: 'stopwatch-outline',
  stream: 'tv-outline',
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
  const sessions = getMySessions(event.id, team ? profile : { ...profile, role: 'driver', carId: undefined });
  const days = [...new Set(sessions.map((s) => formatDay(s.startsAt)))];
  const docs = team ? getDocuments(profile).filter((d) => d.eventId === event.id) : [];
  const crewByCar = new Map<string, typeof event.crew>();
  for (const c of event.crew) {
    const key = c.carId ?? '';
    crewByCar.set(key, [...(crewByCar.get(key) ?? []), c]);
  }
  // Next travel items for this person (upcoming first, else the start of the plan).
  const allMine = team ? getTravel(event.id, profile) : [];
  const upcoming = allMine.filter((t) => new Date(t.endsAt ?? t.startsAt).getTime() > Date.now());
  const myTravel = upcoming.length ? upcoming : allMine;
  const canSeePhones = profile.role === 'management';

  return (
    <Screen>
      <Stack.Screen options={{ title: event.name }} />
      <Card>
        <ThemedText type="small" themeColor="textSecondary">
          {getChampionship(event.championshipId)?.name}
        </ThemedText>
        <ThemedText style={{ fontWeight: 700, fontSize: 20 }}>{event.name}</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          {event.circuit} · {event.location}
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          {formatDateRange(event.startDate, event.endDate)}
        </ThemedText>
        <ThemedText type="small" style={{ marginTop: 8 }}>
          {event.summary}
        </ThemedText>
        <ThemedText
          type="linkPrimary"
          onPress={() =>
            Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${event.latitude},${event.longitude}`)
          }>
          Open circuit in Maps
        </ThemedText>
      </Card>

      <SectionTitle>Live timing, results and videos</SectionTitle>
      {event.links.length ? (
        event.links.map((l) => (
          <ExternalLink key={l.kind + l.label} href={l.url as `https://${string}`} asChild>
            <Card style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <Icon name={linkIcon[l.kind]} size={22} />
              <ThemedText style={{ fontWeight: 600 }}>{l.label}</ThemedText>
            </Card>
          </ExternalLink>
        ))
      ) : (
        <Empty>Links will appear here closer to the event.</Empty>
      )}

      <SectionTitle>Schedule</SectionTitle>
      {days.length ? (
        days.map((day) => (
          <Card key={day} style={{ gap: 6 }}>
            <ThemedText type="smallBold">{day}</ThemedText>
            {sessions
              .filter((s) => formatDay(s.startsAt) === day)
              .map((s) => (
                <Row key={s.id} style={{ alignItems: 'flex-start' }}>
                  <ThemedText type="small" themeColor="textSecondary" style={{ width: 50 }}>
                    {formatTime(s.startsAt)}
                  </ThemedText>
                  <ThemedText type="small" style={{ flex: 1 }}>
                    {s.title}
                    {s.carId ? ` (Car ${getCar(s.carId)?.number})` : ''}
                  </ThemedText>
                </Row>
              ))}
          </Card>
        ))
      ) : (
        <Empty>Schedule not published yet.</Empty>
      )}

      {team ? (
        <>
          <SectionTitle>Crew and cars</SectionTitle>
          {event.crew.length ? (
            [...crewByCar.entries()].map(([carId, crew]) => {
              const car = getCar(carId);
              return (
                <Card key={carId || 'team'} style={{ gap: 8 }}>
                  <ThemedText type="smallBold">{car ? `Car ${car.number} · ${car.model}` : 'Team'}</ThemedText>
                  {crew.map((c) => {
                    const m = getMember(c.memberId);
                    if (!m) return null;
                    return (
                      <Row key={c.memberId}>
                        <Icon name="person-circle-outline" size={26} />
                        <View style={{ flex: 1 }}>
                          <ThemedText type="small" style={{ fontWeight: 600 }}>
                            {m.name}
                            {m.id === profile.id ? ' (you)' : ''}
                          </ThemedText>
                          <ThemedText type="small" themeColor="textSecondary">
                            {c.duty}
                          </ThemedText>
                        </View>
                        {canSeePhones && m.phone ? (
                          <Icon name="call-outline" onPress={() => Linking.openURL(`tel:${m.phone}`)} accessibilityLabel={`Call ${m.name}`} />
                        ) : null}
                      </Row>
                    );
                  })}
                </Card>
              );
            })
          ) : (
            <Empty>Crew list coming soon.</Empty>
          )}

          <SectionTitle>Documents</SectionTitle>
          {docs.length ? docs.map((d) => <DocumentRow key={d.id} doc={d} />) : <Empty>No documents for this event yet.</Empty>}

          <SectionTitle>Travel</SectionTitle>
          {myTravel.length ? (
            <>
              {myTravel.slice(0, 2).map((t) => (
                <TravelRow key={t.id} item={t} />
              ))}
              <Button
                label="Full travel plan"
                icon="airplane-outline"
                secondary
                onPress={() => router.push({ pathname: '/travel/[eventId]', params: { eventId: event.id } })}
              />
            </>
          ) : (
            <Empty>Travel plan coming soon.</Empty>
          )}
        </>
      ) : null}
    </Screen>
  );
}
