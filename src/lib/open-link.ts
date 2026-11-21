import { Linking } from 'react-native';

/** Opens a link outside the app, so a Drive / Dropbox / OneDrive link opens in its app when installed. */
export function openLink(url: string) {
  if (process.env.EXPO_OS === 'web') {
    window.open(url, '_blank', 'noopener');
    return;
  }
  Linking.openURL(url).catch(() => {});
}

export const isHttps = (url: string) => /^https:\/\/\S+\.\S+/.test(url.trim());
