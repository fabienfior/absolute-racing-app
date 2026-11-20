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

const DIRECTIONS: { id: TravelItem['direction']; label: string }[] = [
  { id: 'outbound', label: 'Outbound' },
  { id: 'onsite', label: 'On site' },
  { id: 'return', label: 'Return' },
];

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
      <Stack.Screen options={{ title: event ? `Travel · ${event.name}` : 'Travel' }} />
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two }}>
        {DIRECTIONS.map((d) => (
          <Chip key={d.id} label={d.label} active={direction === d.id} onPress={() => setDirection(d.id)} />
        ))}
      </View>
      {isManagement ? (
        <View style={{ flexDirection: 'row', gap: Spacing.two }}>
          <Chip label="My plan" active={!everyone} onPress={() => setEveryone(false)} />
          <Chip label="Everyone" active={everyone} onPress={() => setEveryone(true)} />
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
        <Empty>Nothing booked here yet.</Empty>
      )}
    </Screen>
  );
}
