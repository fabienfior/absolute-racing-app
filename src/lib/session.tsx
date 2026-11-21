import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';

import { alerts as demoAlerts, documentReads, members, messages as demoMessages, onboardFolders } from '@/data/demo';

import type { Alert, Member, Message, OnboardFolder, Role, Target } from './types';

/**
 * Demo app state. Once Supabase is connected, the profile comes from the signed-in
 * user, and alerts / read receipts live in the `alerts`, `alert_reads` and
 * `document_reads` tables (with realtime updates and push notifications).
 */
type AppState = {
  /** null until the person picks Team or Guest on the welcome screen. */
  entered: 'team' | 'guest' | null;
  enter: (mode: 'team' | 'guest', role?: Role) => void;
  signOut: () => void;
  profile: Member;
  setRole: (role: Role) => void;
  alerts: Alert[];
  sendAlert: (input: { title: string; body: string; target: Target; documentId?: string }) => void;
  docReads: Record<string, string[]>;
  markDocRead: (docId: string) => void;
  readAlertIds: Set<string>;
  markAlertRead: (alertId: string) => void;
  /** When this person last opened each chat channel (ISO time). */
  channelReadAt: Record<string, string>;
  markChannelRead: (channelId: string) => void;
  messages: Message[];
  sendMessage: (channelId: string, body: string) => void;
  /** Onboard folders (drive links). Crew adds folders and videos. */
  folders: OnboardFolder[];
  addFolder: (input: Pick<OnboardFolder, 'name' | 'eventId' | 'carId' | 'driveUrl'>) => string;
  addVideo: (folderId: string, label: string, url: string) => void;
  /** When this person last opened the series updates page. */
  seriesSeenAt: string;
  markSeriesSeen: () => void;
};

const AppContext = createContext<AppState | null>(null);

const DEMO_MEMBER: Record<Role, string> = { management: 'u-tm', driver: 'u-d1', sponsor: 'u-sp' };

export function SessionProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<Role>('management');
  const [entered, setEntered] = useState<'team' | 'guest' | null>(null);
  const enter = useCallback((mode: 'team' | 'guest', r?: Role) => {
    setRole(mode === 'guest' ? 'sponsor' : (r ?? 'management'));
    setEntered(mode);
  }, []);
  const signOut = useCallback(() => setEntered(null), []);
  const [alerts, setAlerts] = useState<Alert[]>(demoAlerts);
  const [docReads, setDocReads] = useState<Record<string, string[]>>(documentReads);
  const [readAlertIds, setReadAlertIds] = useState<Set<string>>(new Set(['a3']));

  // Demo: the drivers' and team chats have messages newer than the last visit.
  const [channelReadAt, setChannelReadAt] = useState<Record<string, string>>(() => {
    const d = new Date();
    d.setDate(d.getDate() - 2);
    return { 'all-team': d.toISOString(), drivers: d.toISOString(), management: new Date().toISOString() };
  });
  const markChannelRead = useCallback(
    (channelId: string) => setChannelReadAt((prev) => ({ ...prev, [channelId]: new Date().toISOString() })),
    [],
  );

  const profile = members.find((m) => m.id === DEMO_MEMBER[role])!;

  // Local for now; Supabase Realtime replaces this so messages reach the other phone instantly.
  const [messages, setMessages] = useState<Message[]>(demoMessages);
  const sendMessage = useCallback(
    (channelId: string, body: string) =>
      setMessages((prev) => [
        ...prev,
        { id: `m${Date.now()}`, channelId, author: profile.name, body, sentAt: new Date().toISOString() },
      ]),
    [profile.name],
  );

  const [folders, setFolders] = useState<OnboardFolder[]>(onboardFolders);
  const addFolder = useCallback<AppState['addFolder']>(
    (input) => {
      const id = `f${Date.now()}`;
      setFolders((prev) => [{ id, videos: [], createdAt: new Date().toISOString(), createdBy: profile.name, ...input }, ...prev]);
      return id;
    },
    [profile.name],
  );
  const addVideo = useCallback(
    (folderId: string, label: string, url: string) =>
      setFolders((prev) =>
        prev.map((f) => (f.id === folderId ? { ...f, videos: [...f.videos, { id: `v${Date.now()}`, label, url }] } : f)),
      ),
    [],
  );

  // Demo: updates found in the last 12 hours count as new.
  const [seriesSeenAt, setSeriesSeenAt] = useState(() => new Date(Date.now() - 12 * 3_600_000).toISOString());
  const markSeriesSeen = useCallback(() => setSeriesSeenAt(new Date().toISOString()), []);

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
    () => ({ entered, enter, signOut, profile, setRole, alerts, sendAlert, docReads, markDocRead, readAlertIds, markAlertRead, channelReadAt, markChannelRead, messages, sendMessage, folders, addFolder, addVideo, seriesSeenAt, markSeriesSeen }),
    [entered, enter, signOut, profile, alerts, sendAlert, docReads, markDocRead, readAlertIds, markAlertRead, channelReadAt, markChannelRead, messages, sendMessage, folders, addFolder, addVideo, seriesSeenAt, markSeriesSeen],
  );
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useSession() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useSession must be used inside SessionProvider');
  return ctx;
}
