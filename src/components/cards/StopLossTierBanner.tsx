import { View, Text } from 'react-native';
import { ChevronRight, TriangleAlert, Sparkles } from 'lucide-react-native';
import { GlassCard } from '@/components/ui/GlassCard';
import { colors, fontFamily } from '@/theme/tokens';
import { StopLossTierKey } from '@/theme/tokens';

interface StopLossTierBannerProps {
  tier: { key: StopLossTierKey; label: string; color: string };
  utilisation: number;
  message: string;
  onPress?: () => void;
}

export function StopLossTierBanner({ tier, utilisation, message, onPress }: StopLossTierBannerProps) {
  if (tier.key === 'green') return null;

  return (
    <GlassCard onPress={onPress} radius={20} style={{ borderColor: `${tier.color}55` }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16 }}>
        <View
          style={{
            width: 40,
            height: 40,
            borderRadius: 12,
            backgroundColor: `${tier.color}22`,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {tier.key === 'yellow' ? (
            <Sparkles size={19} color={tier.color} />
          ) : (
            <TriangleAlert size={19} color={tier.color} />
          )}
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ color: tier.color, fontFamily: fontFamily.bold, fontSize: 13.5 }}>
            {tier.label} — {utilisation.toFixed(0)}% used
          </Text>
          <Text numberOfLines={2} style={{ color: colors.inkSecondary, fontFamily: fontFamily.medium, fontSize: 12.5, marginTop: 2 }}>
            {message}
          </Text>
        </View>
        <ChevronRight size={18} color={colors.inkMuted} />
      </View>
    </GlassCard>
  );
}
