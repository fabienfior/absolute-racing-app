import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { View } from 'react-native';

import { AlertBell } from '@/components/alert-bell';
import { DocumentRow } from '@/components/document-row';
import { ThemedText } from '@/components/themed-text';
import { Button, Card, Empty, Icon, Pill, Row, Screen, SectionTitle } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { getCar, getChampionship, getCurrentOrNextEvent, getDocuments, getMySessions } from '@/data/queries';
import { useTheme } from '@/hooks/use-theme';
import { formatCountdown, formatDateRange, formatTime, isSameDay } from '@/lib/format';
import { useSession } from '@/lib/session';
import { useWeather, weatherLabel } from '@/lib/weather';

function useNow(intervalMs = 1000) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(t);
  }, [intervalMs]);
  return now;
}

export function TodayScreen() {
  const theme = useTheme();
  const now = useNow();
  const { profile, docReads } = useSession();
  const event = getCurrentOrNextEvent();
  const car = getCar(profile.carId);
  const sessions = event ? getMySessions(event.id, profile) : [];
  const live = sessions.find((s) => new Date(s.startsAt).getTime() <= now && new Date(s.endsAt).getTime() > now);
  const next = sessions.find((s) => new Date(s.startsAt).getTime() > now);
  const todays = sessions.filter((s) => isSameDay(s.startsAt));
  const weather = useWeather(event?.latitude, event?.longitude);
  const unreadDocs = getDocuments(profile).filter((d) => !(docReads[d.id] ?? []).includes(profile.id));
  const firstName = profile.name.split(' ')[0];

  return (
    <Screen title={`Hi ${firstName}`} right={<AlertBell />}>
      <Row>
        <Pill label={profile.jobTitle} muted />
        {car ? <Pill label={`Car ${car.number} · ${car.model}`} /> : null}
      </Row>

      {event ? (
        <Card onPress={() => router.push({ pathname: '/event/[id]', params: { id: event.id } })}>
          <ThemedText type="small" themeColor="textSecondary">
            {getChampionship(event.championshipId)?.short} · {formatDateRange(event.startDate, event.endDate)}
          </ThemedText>
          <ThemedText style={{ fontWeight: 700, fontSize: 20 }}>{event.name}</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {event.circuit}
          </ThemedText>
          <View style={{ marginTop: Spacing.two, gap: 2 }}>
            {live ? (
              <>
                <Pill label="On now" />
                <ThemedText style={{ fontWeight: 700 }}>{live.title}</ThemedText>
                <ThemedText type="small" themeColor="textSecondary">
                  Ends {formatTime(live.endsAt)}
                </ThemedText>
              </>
            ) : null}
            {next ? (
              <>
                <ThemedText type="small" themeColor="textSecondary" style={{ marginTop: live ? Spacing.two : 0 }}>
                  Next: {next.title}
                </ThemedText>
                <ThemedText style={{ fontSize: 34, lineHeight: 40, fontWeight: 800, color: theme.tint, fontVariant: ['tabular-nums'] }}>
                  {formatCountdown(new Date(next.startsAt).getTime() - now)}
                </ThemedText>
              </>
            ) : null}
          </View>
        </Card>
      ) : (
        <Empty>No upcoming events.</Empty>
      )}

      {weather ? (
        <Card>
          <Row>
            <Icon name={weatherLabel(weather.code).icon} size={30} />
            <View style={{ flex: 1 }}>
              <ThemedText style={{ fontWeight: 700 }}>
                {weather.temperature}°C · {weatherLabel(weather.code).label}
              </ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                Track weather · Rain {weather.rainChance}% · Wind {weather.wind} km/h
              </ThemedText>
            </View>
          </Row>
        </Card>
      ) : null}

      {profile.role === 'management' ? (
        <Button label="Send an alert" icon="megaphone-outline" onPress={() => router.push('/notify')} />
      ) : null}

      <SectionTitle>Today</SectionTitle>
      {todays.length ? (
        <Card style={{ gap: Spacing.two }}>
          {todays.map((s) => {
            const start = new Date(s.startsAt).getTime();
            const end = new Date(s.endsAt).getTime();
            const state = end <= now ? 'done' : start <= now ? 'live' : 'todo';
            return (
              <Row key={s.id} style={{ opacity: state === 'done' ? 0.45 : 1 }}>
                <ThemedText type="small" themeColor="textSecondary" style={{ width: 50, fontVariant: ['tabular-nums'] }}>
                  {formatTime(s.startsAt)}
                </ThemedText>
                <View style={{ width: 3, alignSelf: 'stretch', borderRadius: 2, backgroundColor: state === 'live' ? theme.tint : theme.border }} />
                <ThemedText type="small" style={{ flex: 1, fontWeight: state === 'live' ? 700 : 500 }}>
                  {s.title}
                  {s.carId ? ` (Car ${getCar(s.carId)?.number})` : ''}
                </ThemedText>
              </Row>
            );
          })}
        </Card>
      ) : (
        <Empty>Nothing scheduled today.</Empty>
      )}

      <SectionTitle
        right={
          <ThemedText type="linkPrimary" onPress={() => router.push('/documents')}>
            All documents
          </ThemedText>
        }>
        To read
      </SectionTitle>
      {unreadDocs.length ? unreadDocs.slice(0, 3).map((d) => <DocumentRow key={d.id} doc={d} />) : <Empty>You’re all caught up.</Empty>}
    </Screen>
  );
}
