import { router } from 'expo-router';
import { Pressable, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Icon } from '@/components/ui';
import { getMyAlerts } from '@/data/queries';
import { useTheme } from '@/hooks/use-theme';
import { useSession } from '@/lib/session';
import { t } from '@/i18n';

export function AlertBell() {
  const theme = useTheme();
  const { alerts, profile, readAlertIds } = useSession();
  const unread = getMyAlerts(alerts, profile).filter((a) => !readAlertIds.has(a.id)).length;

  return (
    <Pressable onPress={() => router.push('/alerts')} accessibilityLabel={t('alerts.unread', { count: unread })} style={{ padding: 6 }}>
      <Icon name="notifications-outline" size={26} />
      {unread > 0 ? (
        <View
          style={{
            position: 'absolute',
            top: 2,
            right: 0,
            minWidth: 18,
            height: 18,
            borderRadius: 9,
            backgroundColor: theme.tint,
            alignItems: 'center',
            justifyContent: 'center',
            paddingHorizontal: 4,
          }}>
          <ThemedText style={{ color: '#fff', fontSize: 11, lineHeight: 14, fontWeight: 700 }}>{unread}</ThemedText>
        </View>
      ) : null}
    </Pressable>
  );
}
