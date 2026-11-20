import { View } from 'react-native';

import { AlertBell } from '@/components/alert-bell';
import { HomeButton } from '@/components/home-button';
import { useSession } from '@/lib/session';
import { isTeam } from '@/lib/types';

/** Home + notifications, shown together at the top of every page. */
export function HeaderActions() {
  const { profile, entered } = useSession();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
      <HomeButton />
      {entered && isTeam(profile.role) ? <AlertBell /> : null}
    </View>
  );
}
