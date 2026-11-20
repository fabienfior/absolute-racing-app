import { Ionicons } from '@expo/vector-icons';
import { Linking, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Card, Icon, Row } from '@/components/ui';
import { getMember } from '@/data/queries';
import { formatTime } from '@/lib/format';
import type { TravelItem, TravelKind } from '@/lib/types';
import { locale, t } from '@/i18n';
import type { TranslationKey } from '@/i18n/en';

export const TRAVEL_ICON: Record<TravelKind, keyof typeof Ionicons.glyphMap> = {
  flight: 'airplane-outline',
  train: 'train-outline',
  rental: 'key-outline',
  shuttle: 'bus-outline',
  hotel: 'bed-outline',
  restaurant: 'restaurant-outline',
  other: 'ellipse-outline',
};

const START_LABEL: Partial<Record<TravelKind, TranslationKey>> = { hotel: 'travel.checkIn', rental: 'travel.pickUp', restaurant: 'travel.tableAt' };
const END_LABEL: Partial<Record<TravelKind, TranslationKey>> = { hotel: 'travel.checkOut', rental: 'travel.dropOff', flight: 'travel.arrives', train: 'travel.arrives' };

export function TravelRow({ item, showPeople }: { item: TravelItem; showPeople?: boolean }) {
  const end = item.endsAt ? new Date(item.endsAt) : undefined;
  const multiDay = end && end.toDateString() !== new Date(item.startsAt).toDateString();
  const people = item.memberIds.map((id) => getMember(id)?.name.split(' ')[0]).filter(Boolean);

  return (
    <Card>
      <Row style={{ alignItems: 'flex-start' }}>
        <Icon name={TRAVEL_ICON[item.kind]} size={24} />
        <View style={{ flex: 1, gap: 2 }}>
          <ThemedText style={{ fontWeight: 700 }}>{item.title}</ThemedText>
          {item.from || item.to ? (
            <ThemedText type="small">
              {item.from}
              {item.from && item.to ? ' → ' : ''}
              {item.to}
            </ThemedText>
          ) : null}
          <ThemedText type="small" themeColor="textSecondary">
            {t(START_LABEL[item.kind] ?? 'travel.departs')} {formatTime(item.startsAt)}
            {end
              ? ` · ${t(END_LABEL[item.kind] ?? 'travel.until')} ${multiDay ? end.toLocaleDateString(locale(), { weekday: 'short', day: 'numeric', month: 'short' }) + ' ' : ''}${formatTime(item.endsAt!)}`
              : ''}
          </ThemedText>
          {item.reference ? (
            <ThemedText type="small" themeColor="textSecondary">
              {item.reference}
            </ThemedText>
          ) : null}
          {item.notes ? <ThemedText type="small">{item.notes}</ThemedText> : null}
          {showPeople ? (
            <ThemedText type="small" themeColor="textSecondary">
              {people.length ? people.join(', ') : t('common.everyone')}
            </ThemedText>
          ) : null}
          <Row style={{ gap: 16, marginTop: 4 }}>
            {item.address ? (
              <ThemedText
                type="linkPrimary"
                onPress={() => Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(item.address!)}`)}>
                {t('common.map')}
              </ThemedText>
            ) : null}
            {item.phone ? (
              <ThemedText type="linkPrimary" onPress={() => Linking.openURL(`tel:${item.phone}`)}>
                {t('common.call')}
              </ThemedText>
            ) : null}
          </Row>
        </View>
      </Row>
    </Card>
  );
}
