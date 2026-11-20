import { ThemedText } from '@/components/themed-text';
import { Card, Screen } from '@/components/ui';
import { getGuide } from '@/data/queries';

export default function GuideScreen() {
  return (
    <Screen title="Team guide">
      {getGuide().map((s) => (
        <Card key={s.id}>
          <ThemedText style={{ fontWeight: 700 }}>{s.title}</ThemedText>
          <ThemedText type="small">{s.body}</ThemedText>
        </Card>
      ))}
    </Screen>
  );
}
