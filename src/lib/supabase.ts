import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

/**
 * The team's Supabase project. The publishable key is meant to be in the app: what each
 * person can read or change is decided by the row-level security rules in supabase/schema.sql.
 * Set EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_ANON_KEY in `.env` to use another
 * project, or set EXPO_PUBLIC_DEMO=1 to run on the demo data in src/data/demo.ts.
 */
const url = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://arialnjpmnwfxjabttal.supabase.co';
const key = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_epk2WhItoxYhGkFqIa-kaw_qP-Ukqd7';
const demo = process.env.EXPO_PUBLIC_DEMO === '1';

/** Null in demo mode. */
export const supabase = demo
  ? null
  : createClient(url, key, {
      auth: {
        storage: AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
      },
    });
