import { ReactNode } from 'react';
import { View, Text } from 'react-native';
import { colors, fontFamily } from '@/theme/tokens';

interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  subtitle?: string;
  action?: ReactNode;
}

export function EmptyState({ icon, title, subtitle, action }: EmptyStateProps) {
  return (
    <View style={{ alignItems: 'center', justifyContent: 'center', paddingVertical: 48, paddingHorizontal: 32, gap: 14 }}>
      <View
        style={{
          width: 72,
          height: 72,
          borderRadius: 36,
          backgroundColor: colors.glassFillStrong,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {icon}
      </View>
      <Text style={{ color: colors.ink, fontFamily: fontFamily.bold, fontSize: 17, textAlign: 'center' }}>{title}</Text>
      {subtitle && (
        <Text style={{ color: colors.inkMuted, fontFamily: fontFamily.medium, fontSize: 13, textAlign: 'center', lineHeight: 19 }}>
          {subtitle}
        </Text>
      )}
      {action}
    </View>
  );
}
