import { Text } from 'react-native';
import { Screen } from './Screen';
import { colors, fontFamily } from '@/theme/tokens';

export function PlaceholderScreen({ name }: { name: string }) {
  return (
    <Screen>
      <Text style={{ color: colors.ink, fontFamily: fontFamily.bold, fontSize: 20, margin: 24 }}>{name}</Text>
      <Text style={{ color: colors.inkMuted, fontFamily: fontFamily.medium, fontSize: 14, marginHorizontal: 24 }}>
        Coming up next in the build.
      </Text>
    </Screen>
  );
}
