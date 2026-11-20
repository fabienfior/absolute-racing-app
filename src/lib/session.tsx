import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';

import type { Profile, Role } from './types';

/**
 * Demo session. Once Supabase is connected, this reads the signed-in user's
 * profile (and role) from the `profiles` table instead.
 */
type SessionValue = {
  profile: Profile;
  setRole: (role: Role) => void;
};

const SessionContext = createContext<SessionValue | null>(null);

const DEMO_NAMES: Record<Role, string> = {
  management: 'Team Manager',
  driver: 'Driver',
  sponsor: 'Sponsor Guest',
};

export function SessionProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<Role>('management');
  const value = useMemo(
    () => ({ profile: { id: 'demo', fullName: DEMO_NAMES[role], role }, setRole }),
    [role],
  );
  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession() {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error('useSession must be used inside SessionProvider');
  return ctx;
}
