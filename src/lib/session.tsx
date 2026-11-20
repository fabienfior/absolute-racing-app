import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';

import { alerts as demoAlerts, documentReads, members } from '@/data/demo';

import type { Alert, Member, Role, Target } from './types';

/**
 * Demo app state. Once Supabase is connected, the profile comes from the signed-in
 * user, and alerts / read receipts live in the `alerts`, `alert_reads` and
 * `document_reads` tables (with realtime updates and push notifications).
 */
type AppState = {
  profile: Member;
  setRole: (role: Role) => void;
  alerts: Alert[];
  sendAlert: (input: { title: string; body: string; target: Target; documentId?: string }) => void;
  docReads: Record<string, string[]>;
  markDocRead: (docId: string) => void;
  readAlertIds: Set<string>;
  markAlertRead: (alertId: string) => void;
};

const AppContext = createContext<AppState | null>(null);

const DEMO_MEMBER: Record<Role, string> = { management: 'u-tm', driver: 'u-d1', sponsor: 'u-sp' };

export function SessionProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<Role>('management');
  const [alerts, setAlerts] = useState<Alert[]>(demoAlerts);
  const [docReads, setDocReads] = useState<Record<string, string[]>>(documentReads);
  const [readAlertIds, setReadAlertIds] = useState<Set<string>>(new Set(['a3']));

  const profile = members.find((m) => m.id === DEMO_MEMBER[role])!;

  const sendAlert = useCallback<AppState['sendAlert']>(
    (input) =>
      setAlerts((prev) => [
        { id: `a${Date.now()}`, sentAt: new Date().toISOString(), sentBy: profile.name, ...input },
        ...prev,
      ]),
    [profile.name],
  );

  const markDocRead = useCallback(
    (docId: string) =>
      setDocReads((prev) => {
        const readers = prev[docId] ?? [];
        return readers.includes(profile.id) ? prev : { ...prev, [docId]: [...readers, profile.id] };
      }),
    [profile.id],
  );

  const markAlertRead = useCallback(
    (alertId: string) => setReadAlertIds((prev) => (prev.has(alertId) ? prev : new Set(prev).add(alertId))),
    [],
  );

  const value = useMemo(
    () => ({ profile, setRole, alerts, sendAlert, docReads, markDocRead, readAlertIds, markAlertRead }),
    [profile, alerts, sendAlert, docReads, markDocRead, readAlertIds, markAlertRead],
  );
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useSession() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useSession must be used inside SessionProvider');
  return ctx;
}
