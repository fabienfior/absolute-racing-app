import { ScrollView } from 'react-native';
import { useState } from 'react';

import { DocumentRow } from '@/components/document-row';
import { Chip, Empty, Screen } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { getDocuments } from '@/data/queries';
import { useSession } from '@/lib/session';
import { DOC_CATEGORIES, type DocCategory } from '@/lib/types';
import { t } from '@/i18n';

export default function DocumentsScreen() {
  const { profile } = useSession();
  const [category, setCategory] = useState<DocCategory | 'all'>('all');
  const docs = getDocuments(profile).filter((d) => category === 'all' || d.category === category);

  return (
    <Screen home title={t('tab.documents')}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: Spacing.two }}>
        <Chip label={t('common.all')} active={category === 'all'} onPress={() => setCategory('all')} />
        {DOC_CATEGORIES.map((c) => (
          <Chip key={c.id} label={t(`cat.${c.id}`)} active={category === c.id} onPress={() => setCategory(c.id)} />
        ))}
      </ScrollView>
      {docs.length ? docs.map((d) => <DocumentRow key={d.id} doc={d} />) : <Empty>{t('docs.empty')}</Empty>}
    </Screen>
  );
}
