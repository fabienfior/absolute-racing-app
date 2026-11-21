import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { View } from 'react-native';

import { DocumentRow } from '@/components/document-row';
import { DriverMenu } from '@/components/driver-menu';
import { ThemedText } from '@/components/themed-text';
import { Button, Card, Empty, Icon, Pill, Row, Screen, SectionTitle } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { getCar, getChampionship, getCurrentOrNextEvent, getDocuments, getMySessions, getTravel } from '@/data/queries';
import { useTheme } from '@/hooks/use-theme';
import { formatCountdown, formatDateRange, formatTime, isSameDay } from '@/lib/format';
import { useSession } from '@/lib/session';
import { useWeather, weatherLabel } from '@/lib/weather';
import { t } from '@/i18n';

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
  const travelToday = event
    ? getTravel(event.id, profile)
        .filter((t) => isSameDay(t.startsAt))
        .map((t) => ({ id: t.id, startsAt: t.startsAt, endsAt: t.endsAt ?? t.startsAt, title: t.title, carId: undefined, travel: true }))
    : [];
  const todays = [...sessions.filter((s) => isSameDay(s.startsAt)), ...travelToday].sort((a, b) =>
    a.startsAt.localeCompare(b.startsAt),
  );
  const weather = useWeather(event?.latitude, event?.longitude);
  const unreadDocs = getDocuments(profile).filter((d) => !(docReads[d.id] ?? []).includes(profile.id));
  const firstName = profile.name.split(' ')[0];

  return (
    <Screen logo home>
      <ThemedText type="subtitle">{t('today.hi', { name: firstName })}</ThemedText>
      <Row>
        <Pill label={profile.jobTitle} muted />
        {car ? <Pill label={`${t('today.car', { number: car.number })} · ${car.model}`} /> : null}
      </Row>

      {event ? (
        <Card accent onPress={() => router.push({ pathname: '/event/[id]', params: { id: event.id } })}>
          <ThemedText type="label">
            {getChampionship(event.championshipId)?.short} · {formatDateRange(event.startDate, event.endDate)}
          </ThemedText>
          <ThemedText style={{ fontWeight: 900, fontSize: 26, lineHeight: 30, textTransform: 'uppercase' }}>{event.name}</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {event.circuit}
          </ThemedText>
          <View style={{ marginTop: Spacing.two, gap: 2 }}>
            {live ? (
              <>
                <Pill label={t('today.onNow')} />
                <ThemedText style={{ fontWeight: 700 }}>{live.title}</ThemedText>
                <ThemedText type="small" themeColor="textSecondary">
                  {t('today.ends', { time: formatTime(live.endsAt) })}
                </ThemedText>
              </>
            ) : null}
            {next ? (
              <>
                <ThemedText type="small" themeColor="textSecondary" style={{ marginTop: live ? Spacing.two : 0 }}>
                  {t('today.next', { title: next.title })}
                </ThemedText>
                <ThemedText style={{ fontSize: 46, lineHeight: 52, fontWeight: 900, color: theme.tint, fontVariant: ['tabular-nums'] }}>
                  {formatCountdown(new Date(next.startsAt).getTime() - now)}
                </ThemedText>
              </>
            ) : null}
          </View>
        </Card>
      ) : (
        <Empty>{t('today.noUpcoming')}</Empty>
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
                {t('today.weather', { rain: weather.rainChance, wind: weather.wind })}
              </ThemedText>
            </View>
          </Row>
        </Card>
      ) : null}

      {profile.role !== 'sponsor' ? <DriverMenu /> : null}

      {profile.role === 'management' ? (
        <Button label={t('title.sendAlert')} icon="megaphone-outline" onPress={() => router.push('/notify')} />
      ) : null}

      <SectionTitle>{t('today.schedule')}</SectionTitle>
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
                {'travel' in s ? <Icon name="bus-outline" size={14} /> : null}
                <ThemedText type="small" style={{ flex: 1, fontWeight: state === 'live' ? 700 : 500 }}>
                  {s.title}
                  {s.carId ? ` (${t('today.car', { number: getCar(s.carId)?.number ?? '' })})` : ''}
                </ThemedText>
              </Row>
            );
          })}
        </Card>
      ) : (
        <Empty>{t('today.nothingToday')}</Empty>
      )}

      <SectionTitle
        right={
          <ThemedText type="linkPrimary" onPress={() => router.push('/documents')}>
            {t('today.allDocuments')}
          </ThemedText>
        }>
        {t('today.toRead')}
      </SectionTitle>
      {unreadDocs.length ? unreadDocs.slice(0, 3).map((d) => <DocumentRow key={d.id} doc={d} />) : <Empty>{t('today.caughtUp')}</Empty>}
    </Screen>
  );
}
