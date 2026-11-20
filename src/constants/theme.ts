/**
 * Placeholder team branding. Swap these values for the official Absolute Racing colors.
 */
import '@/global.css';

import { Platform } from 'react-native';

export const Brand = {
  primary: '#E10600',
  primaryText: '#ffffff',
};

export const Colors = {
  light: {
    text: '#11131A',
    background: '#ffffff',
    backgroundElement: '#F2F3F5',
    backgroundSelected: '#E3E5EA',
    textSecondary: '#5E636E',
    border: '#E3E5EA',
    tint: Brand.primary,
  },
  dark: {
    text: '#F5F6F8',
    background: '#0B0C0F',
    backgroundElement: '#17191E',
    backgroundSelected: '#262930',
    textSecondary: '#A5AAB4',
    border: '#262930',
    tint: '#FF3B30',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: { sans: 'system-ui', serif: 'ui-serif', rounded: 'ui-rounded', mono: 'ui-monospace' },
  default: { sans: 'normal', serif: 'serif', rounded: 'normal', mono: 'monospace' },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const MaxContentWidth = 800;
