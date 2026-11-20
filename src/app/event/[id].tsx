import { Ionicons } from '@expo/vector-icons';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { Linking, View } from 'react-native';

import { DocumentRow } from '@/components/document-row';
import { ExternalLink } from '@/components/external-link';
import { ThemedText } from '@/components/themed-text';
import { TravelRow } from '@/components/travel-row';
import { Button, Card, Empty, Icon, Row, Screen, SectionTitle } from '@/components/ui';
import { getCar, getChampionship, getDocuments, getEvent, getMember, getMySessions, getTeamResults, getTravel } from '@/data/queries';
import { formatDateRange, formatDay, formatTime } from '@/lib/format';
import { useSession } from '@/lib/session';
import { isTeam, type MediaLink } from '@/lib/types';
import { useForecast, weatherLabel } from '@/lib/weather';
import { locale, t } from '@/i18n';

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
  const forecast = useForecast(event?.latitude, event?.longitude);

  if (!event) {
    return (
      <Screen>
        <Empty>{t('event.notFound')}</Empty>
      </Screen>
    );
  }

  const team = isTeam(profile.role);
  const results = getTeamResults(event.id);
  const eventForecast = (forecast ?? []).filter((d) => d.date >= event.startDate && d.date <= event.endDate);
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
      <Card accent>
        <ThemedText type="label">{getChampionship(event.championshipId)?.name}</ThemedText>
        <ThemedText style={{ fontWeight: 900, fontSize: 26, lineHeight: 30, textTransform: 'uppercase' }}>{event.name}</ThemedText>
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
          {t('event.openMaps')}
        </ThemedText>
      </Card>

      {results.length ? (
        <>
          <SectionTitle>{t('event.ourResults')}</SectionTitle>
          <Card style={{ gap: 8 }}>
            {results.map((r) => (
              <Row key={r.session + r.carId}>
                <ThemedText style={{ width: 44, fontWeight: 800, fontSize: 20 }}>P{r.position}</ThemedText>
                <View style={{ flex: 1 }}>
                  <ThemedText type="small" style={{ fontWeight: 600 }}>
                    {r.session} · {t('today.car', { number: getCar(r.carId)?.number ?? '' })}
                  </ThemedText>
                  {r.classPosition ? (
                    <ThemedText type="small" themeColor="textSecondary">
                      {t('event.classPos', { pos: r.classPosition, class: r.className ?? '' })}
                    </ThemedText>
                  ) : null}
                </View>
                {r.position <= 3 || r.classPosition === 1 ? <Icon name="trophy" size={20} /> : null}
              </Row>
            ))}
          </Card>
        </>
      ) : null}

      {eventForecast.length ? (
        <>
          <SectionTitle>{t('event.trackWeather')}</SectionTitle>
          <Card style={{ flexDirection: 'row', justifyContent: 'space-around' }}>
            {eventForecast.map((d) => (
              <View key={d.date} style={{ alignItems: 'center', gap: 2 }}>
                <ThemedText type="small" themeColor="textSecondary">
                  {new Date(d.date + 'T12:00:00').toLocaleDateString(locale(), { weekday: 'short' })}
                </ThemedText>
                <Icon name={weatherLabel(d.code).icon} size={26} />
                <ThemedText type="smallBold">
                  {d.max}° / {d.min}°
                </ThemedText>
                <ThemedText type="small" themeColor="textSecondary">
                  {t('event.rain', { rain: d.rainChance })}
                </ThemedText>
              </View>
            ))}
          </Card>
        </>
      ) : null}

      <SectionTitle>{t('event.links')}</SectionTitle>
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
        <Empty>{t('event.noLinks')}</Empty>
      )}

      <SectionTitle>{t('event.schedule')}</SectionTitle>
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
                    {s.carId ? ` (${t('today.car', { number: getCar(s.carId)?.number ?? '' })})` : ''}
                  </ThemedText>
                </Row>
              ))}
          </Card>
        ))
      ) : (
        <Empty>{t('event.noSchedule')}</Empty>
      )}

      {team ? (
        <>
          <SectionTitle>{t('event.crew')}</SectionTitle>
          {event.crew.length ? (
            [...crewByCar.entries()].map(([carId, crew]) => {
              const car = getCar(carId);
              return (
                <Card key={carId || 'team'} style={{ gap: 8 }}>
                  <ThemedText type="smallBold">{car ? `${t('today.car', { number: car.number })} · ${car.model}` : t('event.team')}</ThemedText>
                  {crew.map((c) => {
                    const m = getMember(c.memberId);
                    if (!m) return null;
                    return (
                      <Row key={c.memberId}>
                        <Icon name="person-circle-outline" size={26} />
                        <View style={{ flex: 1 }}>
                          <ThemedText type="small" style={{ fontWeight: 600 }}>
                            {m.name}
                            {m.id === profile.id ? ` (${t('common.you')})` : ''}
                          </ThemedText>
                          <ThemedText type="small" themeColor="textSecondary">
                            {c.duty}
                          </ThemedText>
                        </View>
                        {canSeePhones && m.phone ? (
                          <Icon name="call-outline" onPress={() => Linking.openURL(`tel:${m.phone}`)} accessibilityLabel={`${t('common.call')} ${m.name}`} />
                        ) : null}
                      </Row>
                    );
                  })}
                </Card>
              );
            })
          ) : (
            <Empty>{t('event.noCrew')}</Empty>
          )}

          <SectionTitle>{t('event.documents')}</SectionTitle>
          {docs.length ? docs.map((d) => <DocumentRow key={d.id} doc={d} />) : <Empty>{t('event.noDocuments')}</Empty>}

          <SectionTitle>{t('event.travel')}</SectionTitle>
          {myTravel.length ? (
            <>
              {myTravel.slice(0, 2).map((t) => (
                <TravelRow key={t.id} item={t} />
              ))}
              <Button
                label={t('event.fullTravel')}
                icon="airplane-outline"
                secondary
                onPress={() => router.push({ pathname: '/travel/[eventId]', params: { eventId: event.id } })}
              />
            </>
          ) : (
            <Empty>{t('event.noTravel')}</Empty>
          )}
        </>
      ) : null}
    </Screen>
  );
}
