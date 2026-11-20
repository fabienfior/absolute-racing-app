import { SponsorHome } from '@/components/sponsor-home';
import { TodayScreen } from '@/components/today';
import { useSession } from '@/lib/session';
import { isTeam } from '@/lib/types';

export default function HomeTab() {
  const { profile } = useSession();
  return isTeam(profile.role) ? <TodayScreen /> : <SponsorHome />;
}
