/**
 * Placeholder team branding. Swap these values for the official Absolute Racing colors.
 */
import '@/global.css';

import { Platform } from 'react-native';

/** Absolute Racing brand, taken from absoluteracing.net. */
export const Brand = {
  primary: '#D5DF22', // lime
  primaryText: '#0B0E14', // text on lime
};

// The brand is dark-only, so light and dark use the same palette.
const dark = {
  text: '#FFFFFF',
  background: '#0B0E14',
  backgroundElement: '#12161F',
  backgroundSelected: '#1D2330',
  textSecondary: '#9AA3B5',
  border: '#262D3D',
  tint: Brand.primary,
};

export const Colors = { light: dark, dark } as const;

export const FontFamily = {
  regular: 'Saira_400Regular',
  medium: 'Saira_500Medium',
  semibold: 'Saira_600SemiBold',
  bold: 'Saira_700Bold',
  extrabold: 'Saira_800ExtraBold',
  black: 'Saira_900Black',
};

/** Pick the Saira file for a font weight (custom fonts ignore fontWeight on Android). */
export function sairaFor(weight?: string | number) {
  const w = Number(weight ?? 400);
  if (w >= 900) return FontFamily.black;
  if (w >= 800) return FontFamily.extrabold;
  if (w >= 700) return FontFamily.bold;
  if (w >= 600) return FontFamily.semibold;
  if (w >= 500) return FontFamily.medium;
  return FontFamily.regular;
}

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
