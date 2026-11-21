import { router } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Button, Chip, Screen, SectionTitle } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { getCars, getPastEvents, getUpcomingEvents } from '@/data/queries';
import { useTheme } from '@/hooks/use-theme';
import { t } from '@/i18n';
import { isHttps } from '@/lib/open-link';
import { useSession } from '@/lib/session';

export default function NewFolderScreen() {
  const theme = useTheme();
  const { profile, addFolder } = useSession();
  // The current weekend and the last few events are the likely ones.
  const events = [...getUpcomingEvents().slice(0, 2), ...getPastEvents().slice(0, 6)];
  const [eventId, setEventId] = useState<string | undefined>(events[0]?.id);
  const [carId, setCarId] = useState<string | undefined>();
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [error, setError] = useState(false);

  if (profile.role !== 'management') {
    return (
      <Screen>
        <ThemedText>{t('notify.onlyManagement')}</ThemedText>
      </Screen>
    );
  }
  const input = [styles.input, { color: theme.text, backgroundColor: theme.backgroundElement }];

  return (
    <Screen>
      <SectionTitle>{t('onboards.event')}</SectionTitle>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: Spacing.two }}>
        {events.map((e) => (
          <Chip key={e.id} label={e.name} active={eventId === e.id} onPress={() => setEventId(e.id)} />
        ))}
        <Chip label={t('onboards.noEvent')} active={!eventId} onPress={() => setEventId(undefined)} />
      </ScrollView>

      <SectionTitle>{t('onboards.car')}</SectionTitle>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two }}>
        <Chip label={t('onboards.wholeTeam')} active={!carId} onPress={() => setCarId(undefined)} />
        {getCars().map((c) => (
          <Chip key={c.id} label={`${c.number} ${c.model}`} active={carId === c.id} onPress={() => setCarId(c.id)} />
        ))}
      </View>

      <SectionTitle>{t('onboards.folders')}</SectionTitle>
      <TextInput value={name} onChangeText={setName} placeholder={t('onboards.folderName')} placeholderTextColor={theme.textSecondary} style={input} />
      <TextInput
        value={url}
        onChangeText={(v) => {
          setUrl(v);
          setError(false);
        }}
        placeholder={t('onboards.driveLink')}
        placeholderTextColor={theme.textSecondary}
        autoCapitalize="none"
        keyboardType="url"
        style={input}
      />
      {error ? <ThemedText style={{ color: '#FF6B6B' }}>{t('onboards.badLink')}</ThemedText> : null}
      <ThemedText type="small" themeColor="textSecondary">
        {t('onboards.driveHint')}
      </ThemedText>
      <Button
        label={t('onboards.create')}
        icon="folder-open"
        onPress={() => {
          if (!isHttps(url)) return setError(true);
          const id = addFolder({ name: name.trim() || t('onboards.folders'), eventId, carId, driveUrl: url.trim() });
          router.replace(`/onboard-folder/${id}`);
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  input: { borderRadius: 12, paddingHorizontal: Spacing.three, paddingVertical: 12, fontSize: 16 },
});
