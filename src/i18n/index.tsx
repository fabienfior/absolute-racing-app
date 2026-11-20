import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

import { en, type TranslationKey } from './en';
import { fr } from './fr';
import { ja } from './ja';
import { ms } from './ms';
import { th } from './th';
import { zh } from './zh';

export type Language = 'en' | 'fr' | 'zh' | 'ja' | 'th' | 'ms';

export const LANGUAGES: { id: Language; name: string; locale: string }[] = [
  { id: 'en', name: 'English', locale: 'en-GB' },
  { id: 'fr', name: 'Français', locale: 'fr-FR' },
  { id: 'zh', name: '简体中文', locale: 'zh-CN' },
  { id: 'ja', name: '日本語', locale: 'ja-JP' },
  { id: 'th', name: 'ไทย', locale: 'th-TH' },
  { id: 'ms', name: 'Bahasa Melayu', locale: 'ms-MY' },
];

const DICTS: Record<Language, Record<TranslationKey, string>> = { en, fr, zh, ja, th, ms };
const STORAGE_KEY = 'language';

function deviceLanguage(): Language {
  try {
    const tag = Intl.DateTimeFormat().resolvedOptions().locale.toLowerCase();
    const match = LANGUAGES.find((l) => tag.startsWith(l.id));
    return match?.id ?? 'en';
  } catch {
    return 'en';
  }
}

// Module-level so plain functions (date formatting, labels) can translate too.
let current: Language = deviceLanguage();

export function t(key: TranslationKey, params?: Record<string, string | number>) {
  let s = DICTS[current][key] ?? en[key];
  if (params) for (const [k, v] of Object.entries(params)) s = s.replace(`{${k}}`, String(v));
  return s;
}

/** Locale for dates and times, e.g. "fr-FR". */
export const locale = () => LANGUAGES.find((l) => l.id === current)!.locale;

const LanguageContext = createContext<{ language: Language; setLanguage: (l: Language) => void }>({
  language: current,
  setLanguage: () => {},
});

export function LanguageProvider({ children }: { children: (language: Language) => ReactNode }) {
  const [language, setState] = useState<Language>(current);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((saved) => {
        if (saved && saved in DICTS && saved !== current) {
          current = saved as Language;
          setState(current);
        }
      })
      .catch(() => {});
  }, []);

  const setLanguage = (l: Language) => {
    current = l;
    setState(l);
    AsyncStorage.setItem(STORAGE_KEY, l).catch(() => {});
  };

  return <LanguageContext.Provider value={{ language, setLanguage }}>{children(language)}</LanguageContext.Provider>;
}

export const useLanguage = () => useContext(LanguageContext);
