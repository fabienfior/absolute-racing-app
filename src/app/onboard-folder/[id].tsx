import { Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Button, Card, Empty, Icon, Row, Screen, SectionTitle } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { t } from '@/i18n';
import { isHttps, openLink } from '@/lib/open-link';
import { useSession } from '@/lib/session';
import { folderSubtitle } from '@/data/queries';

export default function FolderScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const theme = useTheme();
  const { folders, profile, addVideo } = useSession();
  const folder = folders.find((f) => f.id === id);
  const [label, setLabel] = useState('');
  const [url, setUrl] = useState('');
  const [error, setError] = useState(false);

  if (!folder) {
    return (
      <Screen>
        <Empty>{t('onboards.notFound')}</Empty>
      </Screen>
    );
  }
  const input = [styles.input, { color: theme.text, backgroundColor: theme.backgroundElement }];

  return (
    <Screen>
      <Stack.Screen options={{ title: folder.name }} />
      <View style={{ gap: 4 }}>
        <ThemedText type="subtitle">{folder.name}</ThemedText>
        <ThemedText themeColor="textSecondary">{folderSubtitle(folder)}</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          {t('onboards.by', { name: folder.createdBy })}
        </ThemedText>
      </View>
      <Button label={t('onboards.openDrive')} icon="logo-google" onPress={() => openLink(folder.driveUrl)} />
      <ThemedText type="small" themeColor="textSecondary">
        {t('onboards.driveHint')}
      </ThemedText>

      <SectionTitle>{t('onboards.videos', { count: folder.videos.length })}</SectionTitle>
      {folder.videos.length ? (
        folder.videos.map((v) => (
          <Card key={v.id} onPress={() => openLink(v.url)}>
            <Row>
              <Icon name="videocam" size={24} />
              <ThemedText style={{ flex: 1, fontWeight: 700 }}>{v.label}</ThemedText>
              <Icon name="open-outline" size={18} />
            </Row>
          </Card>
        ))
      ) : (
        <Empty>{t('onboards.empty')}</Empty>
      )}

      {profile.role === 'management' ? (
        <>
          <SectionTitle>{t('onboards.addVideo')}</SectionTitle>
          <TextInput value={label} onChangeText={setLabel} placeholder={t('onboards.videoName')} placeholderTextColor={theme.textSecondary} style={input} />
          <TextInput
            value={url}
            onChangeText={(v) => {
              setUrl(v);
              setError(false);
            }}
            placeholder={t('onboards.videoLink')}
            placeholderTextColor={theme.textSecondary}
            autoCapitalize="none"
            keyboardType="url"
            style={input}
          />
          {error ? <ThemedText style={{ color: '#FF6B6B' }}>{t('onboards.badLink')}</ThemedText> : null}
          <Button
            label={t('onboards.add')}
            icon="add"
            secondary
            onPress={() => {
              if (!isHttps(url)) return setError(true);
              addVideo(folder.id, label.trim() || url.trim(), url.trim());
              setLabel('');
              setUrl('');
            }}
          />
        </>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  input: { borderRadius: 12, paddingHorizontal: Spacing.three, paddingVertical: 12, fontSize: 16 },
});
