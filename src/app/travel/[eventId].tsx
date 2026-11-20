import { Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { TravelRow } from '@/components/travel-row';
import { Chip, Empty, Screen, SectionTitle } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { getEvent, getTravel } from '@/data/queries';
import { formatDay } from '@/lib/format';
import { useSession } from '@/lib/session';
import type { TravelItem } from '@/lib/types';
import { t } from '@/i18n';

const DIRECTIONS: TravelItem['direction'][] = ['outbound', 'onsite', 'return'];

export default function TravelScreen() {
  const { eventId } = useLocalSearchParams<{ eventId: string }>();
  const { profile } = useSession();
  const isManagement = profile.role === 'management';
  const [direction, setDirection] = useState<TravelItem['direction']>('outbound');
  const [everyone, setEveryone] = useState(false);
  const event = getEvent(eventId);
  const items = getTravel(eventId, profile, everyone).filter((t) => t.direction === direction);
  const days = [...new Set(items.map((t) => formatDay(t.startsAt)))];

  return (
    <Screen>
      <Stack.Screen options={{ title: event ? `${t('title.travel')} · ${event.name}` : t('title.travel') }} />
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two }}>
        {DIRECTIONS.map((d) => (
          <Chip key={d} label={t(`travel.${d}`)} active={direction === d} onPress={() => setDirection(d)} />
        ))}
      </View>
      {isManagement ? (
        <View style={{ flexDirection: 'row', gap: Spacing.two }}>
          <Chip label={t('travel.myPlan')} active={!everyone} onPress={() => setEveryone(false)} />
          <Chip label={t('common.everyone')} active={everyone} onPress={() => setEveryone(true)} />
        </View>
      ) : null}
      {days.length ? (
        days.map((day) => (
          <View key={day} style={{ gap: Spacing.three }}>
            <SectionTitle>{day}</SectionTitle>
            {items
              .filter((t) => formatDay(t.startsAt) === day)
              .map((t) => (
                <TravelRow key={t.id} item={t} showPeople={everyone} />
              ))}
          </View>
        ))
      ) : (
        <Empty>{t('travel.nothing')}</Empty>
      )}
    </Screen>
  );
}
