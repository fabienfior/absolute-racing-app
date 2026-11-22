import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';

import { alerts as demoAlerts, documentReads, members, messages as demoMessages, onboardFolders } from '@/data/demo';
import { fromTarget, loadRemote, newId, SetupError, toAlert, toMessage } from '@/data/remote';
import { demoStore, setStore, store } from '@/data/store';

import { supabase } from './supabase';
import { isTeam, type Alert, type Member, type Message, type OnboardFolder, type Role, type Target } from './types';

/**
 * App state. With Supabase connected, the profile comes from the signed-in user and
 * content, alerts, read receipts, messages and onboard folders live in the database
 * (messages and alerts arrive live). Without it, or if the database is not set up yet,
 * the app runs on the demo data in src/data/demo.ts.
 */
type AppState = {
  /** Changes each time content is (re)loaded, so screens re-render. */
  version: number;
  /** True when the app reads the real database (false = demo data). */
  live: boolean;
  /** True until the first load from the database is done. */
  loading: boolean;
  /** null until the person signs in or picks Guest on the welcome screen. */
  entered: 'team' | 'guest' | null;
  enter: (mode: 'team' | 'guest', role?: Role) => void;
  /** Sends a 6-digit sign-in code by email. Returns an error message, or null. */
  requestCode: (email: string) => Promise<string | null>;
  /** Checks the code, then loads the person's data. Returns an error message, or null. */
  verifyCode: (email: string, code: string) => Promise<string | null>;
  signOut: () => void;
  profile: Member;
  /** Crew (and the demo) can preview the app as another role. */
  canPreview: boolean;
  setRole: (role: Role) => void;
  alerts: Alert[];
  sendAlert: (input: { title: string; body: string; target: Target; documentId?: string }) => void;
  docReads: Record<string, string[]>;
  markDocRead: (docId: string) => void;
  readAlertIds: Set<string>;
  markAlertRead: (alertId: string) => void;
  /** When this person last opened each chat channel (ISO time). '*' = for channels never opened. */
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

const DEMO_MEMBER: Record<Role, string> = { crew: 'u-tm', driver: 'u-d1', sponsor: 'u-sp' };
const GUEST: Member = { id: 'guest', name: 'Guest', role: 'sponsor', jobTitle: '' };
const READ_STATE_KEY = 'read-state-v1';

const warn = (what: string) => (r: { error: { message: string } | null }) => {
  if (r.error) console.warn(`[supabase] ${what}: ${r.error.message}`);
};

function demoChannelReadAt() {
  // Demo: the drivers' and team chats have messages newer than the last visit.
  const d = new Date();
  d.setDate(d.getDate() - 2);
  return { 'all-team': d.toISOString(), drivers: d.toISOString(), crew: new Date().toISOString() };
}

export function SessionProvider({ children }: { children: ReactNode }) {
  const db = supabase;
  // Demo mode: no Supabase keys, or the database could not be read (tables not created yet).
  const [demo, setDemo] = useState(!db);
  const [loading, setLoading] = useState(!!db);
  const [userId, setUserId] = useState<string | null>(null);
  const [me, setMe] = useState<Member | null>(null);
  const [version, setVersion] = useState(0);

  const [previewRole, setPreviewRole] = useState<Role | null>(db ? null : 'crew');
  const [guestEntered, setGuestEntered] = useState<'team' | 'guest' | null>(null);

  const [alerts, setAlerts] = useState<Alert[]>(db ? [] : demoAlerts);
  const [docReads, setDocReads] = useState<Record<string, string[]>>(db ? {} : documentReads);
  const [readAlertIds, setReadAlertIds] = useState<Set<string>>(new Set(db ? [] : ['a3']));
  const [channelReadAt, setChannelReadAt] = useState<Record<string, string>>(db ? {} : demoChannelReadAt);
  const [messages, setMessages] = useState<Message[]>(db ? [] : demoMessages);
  const [folders, setFolders] = useState<OnboardFolder[]>(db ? [] : onboardFolders);
  // Demo: updates found in the last 12 hours count as new.
  const [seriesSeenAt, setSeriesSeenAt] = useState(() => new Date(Date.now() - 12 * 3_600_000).toISOString());

  const showDemoData = useCallback(() => {
    setStore(demoStore);
    setDemo(true);
    setMe(null);
    setPreviewRole((r) => r ?? 'crew');
    setAlerts(demoAlerts);
    setDocReads(documentReads);
    setReadAlertIds(new Set(['a3']));
    setChannelReadAt(demoChannelReadAt());
    setMessages(demoMessages);
    setFolders(onboardFolders);
    setVersion((v) => v + 1);
  }, []);

  const loadedOnce = useRef(false);
  /** Loads everything this person may see. Falls back to demo data if the database is not ready. */
  const load = useCallback(
    async (uid: string | null) => {
      if (!db) return;
      try {
        const data = await loadRemote(db, uid);
        setStore(data.store);
        setDemo(false);
        setMe(uid ? (data.me ?? { ...GUEST, id: uid }) : null);
        setAlerts(data.alerts);
        setReadAlertIds(new Set(data.readAlertIds));
        setDocReads(data.docReads);
        setMessages(data.messages);
        setFolders(data.folders);
        setVersion((v) => v + 1);
        loadedOnce.current = true;
      } catch (e) {
        // Tables not created yet, or no connection on first launch: show the demo.
        // If we already have real data (e.g. lost signal at the track), keep showing it.
        const setup = e instanceof SetupError && e.missingTables;
        console.warn(`[supabase] could not load data${setup || !loadedOnce.current ? ', showing demo data' : ''}:`, (e as Error).message);
        if (setup || !loadedOnce.current) showDemoData();
      } finally {
        setLoading(false);
      }
    },
    [db, showDemoData],
  );

  // Who is signed in (kept on the phone between launches), and the first load.
  const userIdRef = useRef<string | null>(null);
  useEffect(() => {
    if (!db) return;
    let first = true;
    db.auth.getSession().then(({ data }) => {
      const uid = data.session?.user.id ?? null;
      userIdRef.current = uid;
      setUserId(uid);
      first = false;
      load(uid);
    });
    const { data: sub } = db.auth.onAuthStateChange((_event, session) => {
      const uid = session?.user.id ?? null;
      if (first || uid === userIdRef.current) return;
      userIdRef.current = uid;
      setUserId(uid);
      load(uid);
    });
    return () => sub.subscription.unsubscribe();
  }, [db, load]);

  // Chat and series "last seen" times are kept on the phone.
  const readStateLoaded = useRef(false);
  useEffect(() => {
    if (!db || demo || !userId) return;
    readStateLoaded.current = false;
    AsyncStorage.getItem(`${READ_STATE_KEY}:${userId}`)
      .then((raw) => {
        const saved = raw ? JSON.parse(raw) : null;
        // First launch: older messages and updates do not count as unread.
        const now = new Date().toISOString();
        setChannelReadAt(saved?.channelReadAt ?? { '*': now });
        setSeriesSeenAt(saved?.seriesSeenAt ?? now);
      })
      .catch(() => {})
      .finally(() => (readStateLoaded.current = true));
  }, [db, demo, userId]);
  useEffect(() => {
    if (!db || demo || !userId || !readStateLoaded.current) return;
    AsyncStorage.setItem(`${READ_STATE_KEY}:${userId}`, JSON.stringify({ channelReadAt, seriesSeenAt })).catch(() => {});
  }, [db, demo, userId, channelReadAt, seriesSeenAt]);

  // New messages and alerts arrive live; new documents reload the lists.
  useEffect(() => {
    if (!db || demo || !userId) return;
    const names = () => new Map(store.members.map((m) => [m.id, m.name]));
    const channel = db
      .channel(`app-${userId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, ({ new: row }) => {
        const m = toMessage(row, names());
        setMessages((prev) => (prev.some((x) => x.id === m.id) ? prev : [...prev, m]));
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'alerts' }, ({ new: row }) => {
        const a = toAlert(row, names());
        setAlerts((prev) => (prev.some((x) => x.id === a.id) ? prev : [a, ...prev]));
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'documents' }, () => load(userId))
      .subscribe();
    return () => {
      db.removeChannel(channel);
    };
  }, [db, demo, userId, load]);

  // ---- Who is using the app ----------------------------------------------------------
  const live = !!db && !demo;
  const realRole: Role | null = live ? (me?.role ?? null) : null;
  const canPreview = !live || realRole === 'crew';
  const role: Role = (canPreview && previewRole) || realRole || 'sponsor';

  const profile: Member = useMemo(() => {
    if (!live) return members.find((m) => m.id === DEMO_MEMBER[role])!;
    const base = me ?? GUEST;
    return role === base.role ? base : { ...base, role };
  }, [live, me, role]);

  const entered: AppState['entered'] = loading
    ? null
    : live && me
      ? isTeam(me.role)
        ? 'team'
        : 'guest'
      : guestEntered;

  const enter = useCallback((mode: 'team' | 'guest', r?: Role) => {
    setPreviewRole(mode === 'guest' ? 'sponsor' : (r ?? 'crew'));
    setGuestEntered(mode);
  }, []);

  const setRole = useCallback((r: Role) => setPreviewRole(r), []);

  const requestCode = useCallback<AppState['requestCode']>(
    async (email) => {
      if (!db) return 'not-connected';
      const { error } = await db.auth.signInWithOtp({ email: email.trim().toLowerCase(), options: { shouldCreateUser: true } });
      return error ? error.message : null;
    },
    [db],
  );

  const verifyCode = useCallback<AppState['verifyCode']>(
    async (email, code) => {
      if (!db) return 'not-connected';
      const { data, error } = await db.auth.verifyOtp({ email: email.trim().toLowerCase(), token: code.trim(), type: 'email' });
      if (error) return error.message;
      const uid = data.user?.id ?? null;
      userIdRef.current = uid;
      setUserId(uid);
      setPreviewRole(null);
      setLoading(true);
      await load(uid);
      return null;
    },
    [db, load],
  );

  const signOut = useCallback(() => {
    setGuestEntered(null);
    setPreviewRole(db ? null : 'crew');
    if (db && userIdRef.current) {
      userIdRef.current = null;
      setUserId(null);
      setMe(null);
      db.auth.signOut().finally(() => load(null));
    }
  }, [db, load]);

  // ---- Changes (saved to the database when live) ---------------------------------------
  const markChannelRead = useCallback(
    (channelId: string) => setChannelReadAt((prev) => ({ ...prev, [channelId]: new Date().toISOString() })),
    [],
  );

  const sendMessage = useCallback(
    (channelId: string, body: string) => {
      const m: Message = { id: live ? newId() : `m${Date.now()}`, channelId, author: profile.name, authorId: profile.id, body, sentAt: new Date().toISOString() };
      setMessages((prev) => [...prev, m]);
      if (!live || !db) return;
      const other = channelId.startsWith('dm:') ? channelId.slice(3).split(':').find((id) => id !== profile.id) : undefined;
      db.from('messages')
        .insert({ id: m.id, body, ...(other ? { recipient_id: other } : { channel_id: channelId }) })
        .then(warn('send message'));
    },
    [live, db, profile.name, profile.id],
  );

  const addFolder = useCallback<AppState['addFolder']>(
    (input) => {
      const id = live ? newId() : `f${Date.now()}`;
      setFolders((prev) => [{ id, videos: [], createdAt: new Date().toISOString(), createdBy: profile.name, ...input }, ...prev]);
      if (live && db)
        db.from('onboard_folders')
          .insert({ id, name: input.name, event_id: input.eventId ?? null, car_id: input.carId ?? null, drive_url: input.driveUrl })
          .then(warn('add folder'));
      return id;
    },
    [live, db, profile.name],
  );

  const addVideo = useCallback(
    (folderId: string, label: string, url: string) => {
      const id = live ? newId() : `v${Date.now()}`;
      setFolders((prev) => prev.map((f) => (f.id === folderId ? { ...f, videos: [...f.videos, { id, label, url }] } : f)));
      if (live && db) db.from('onboard_videos').insert({ id, folder_id: folderId, label, url }).then(warn('add video'));
    },
    [live, db],
  );

  const markSeriesSeen = useCallback(() => setSeriesSeenAt(new Date().toISOString()), []);

  const sendAlert = useCallback<AppState['sendAlert']>(
    (input) => {
      const id = live ? newId() : `a${Date.now()}`;
      setAlerts((prev) => [{ id, sentAt: new Date().toISOString(), sentBy: profile.name, ...input }, ...prev]);
      if (live && db)
        db.from('alerts')
          .insert({ id, title: input.title, body: input.body, document_id: input.documentId ?? null, ...fromTarget(input.target) })
          .then(warn('send alert'));
    },
    [live, db, profile.name],
  );

  const markDocRead = useCallback(
    (docId: string) => {
      setDocReads((prev) => {
        const readers = prev[docId] ?? [];
        return readers.includes(profile.id) ? prev : { ...prev, [docId]: [...readers, profile.id] };
      });
      if (live && db && me && !(docReads[docId] ?? []).includes(me.id))
        db.from('document_reads').upsert({ document_id: docId }, { ignoreDuplicates: true }).then(warn('confirm read'));
    },
    [live, db, me, docReads, profile.id],
  );

  const markAlertRead = useCallback(
    (alertId: string) => {
      setReadAlertIds((prev) => (prev.has(alertId) ? prev : new Set(prev).add(alertId)));
      if (live && db && me && !readAlertIds.has(alertId))
        db.from('alert_reads').upsert({ alert_id: alertId }, { ignoreDuplicates: true }).then(warn('mark alert read'));
    },
    [live, db, me, readAlertIds],
  );

  const value = useMemo(
    () => ({ version, live, loading, entered, enter, requestCode, verifyCode, signOut, profile, canPreview, setRole, alerts, sendAlert, docReads, markDocRead, readAlertIds, markAlertRead, channelReadAt, markChannelRead, messages, sendMessage, folders, addFolder, addVideo, seriesSeenAt, markSeriesSeen }),
    [version, live, loading, entered, enter, requestCode, verifyCode, signOut, profile, canPreview, setRole, alerts, sendAlert, docReads, markDocRead, readAlertIds, markAlertRead, channelReadAt, markChannelRead, messages, sendMessage, folders, addFolder, addVideo, seriesSeenAt, markSeriesSeen],
  );
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useSession() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useSession must be used inside SessionProvider');
  return ctx;
}
