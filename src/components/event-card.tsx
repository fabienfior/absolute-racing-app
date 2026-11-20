import { router } from 'expo-router';
import { View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Card, Icon, Pill } from '@/components/ui';
import { formatDateRange } from '@/lib/format';
import type { RaceEvent } from '@/lib/types';

export function EventCard({ event, highlight }: { event: RaceEvent; highlight?: string }) {
  return (
    <Card onPress={() => router.push({ pathname: '/event/[id]', params: { id: event.id } })}>
      {highlight ? <Pill label={highlight} /> : null}
      <ThemedText type="default" style={{ fontWeight: 700 }}>
        {event.name}
      </ThemedText>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        <Icon name="location-outline" size={14} />
        <ThemedText type="small" themeColor="textSecondary">
          {event.circuit} · {event.location}
        </ThemedText>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        <Icon name="calendar-outline" size={14} />
        <ThemedText type="small" themeColor="textSecondary">
          {formatDateRange(event.startDate, event.endDate)}
        </ThemedText>
      </View>
    </Card>
  );
}
