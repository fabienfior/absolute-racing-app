import { Platform, StyleSheet, Text, type TextProps, type TextStyle } from 'react-native';

import { Fonts, sairaFor, ThemeColor } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type ThemedTextProps = TextProps & {
  type?: 'default' | 'title' | 'small' | 'smallBold' | 'subtitle' | 'link' | 'linkPrimary' | 'code' | 'label';
  themeColor?: ThemeColor;
};

export function ThemedText({ style, type = 'default', themeColor, ...rest }: ThemedTextProps) {
  const theme = useTheme();
  const flat = (StyleSheet.flatten([styles[type], style]) ?? {}) as TextStyle;
  const family = type === 'code' ? Fonts?.mono : sairaFor(flat.fontWeight as string | number | undefined);

  return (
    <Text
      style={[
        { color: theme[themeColor ?? 'text'] },
        styles[type],
        type === 'linkPrimary' || type === 'label' ? { color: theme.tint } : null,
        style,
        // Weight comes from the font file itself.
        { fontFamily: family, fontWeight: 'normal' },
      ]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  small: { fontSize: 14, lineHeight: 20, fontWeight: 400 },
  smallBold: { fontSize: 14, lineHeight: 20, fontWeight: 700 },
  default: { fontSize: 16, lineHeight: 24, fontWeight: 500 },
  title: { fontSize: 44, fontWeight: 900, lineHeight: 46, textTransform: 'uppercase' },
  subtitle: { fontSize: 30, lineHeight: 34, fontWeight: 900, textTransform: 'uppercase', letterSpacing: 0.5 },
  link: { lineHeight: 30, fontSize: 14 },
  linkPrimary: { lineHeight: 30, fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1 },
  label: { fontSize: 12, lineHeight: 16, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1.6 },
  code: { fontFamily: Fonts?.mono, fontWeight: Platform.select({ android: 700 }) ?? 500, fontSize: 12 },
});
