import { View, Text } from 'react-native';
import { RadialGauge } from '@/components/charts/RadialGauge';
import { colors, fontFamily, tierForUtilisation } from '@/theme/tokens';
import { formatCompactCurrency, formatPercent } from '@/utils/format';

interface BudgetGaugeCardProps {
  spent: number;
  budget: number;
  size?: number;
}

export function BudgetGaugeCard({ spent, budget, size = 148 }: BudgetGaugeCardProps) {
  const pct = budget > 0 ? (spent / budget) * 100 : 0;
  const tier = tierForUtilisation(pct);
  const remaining = Math.max(0, budget - spent);

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 20, padding: 20 }}>
      <RadialGauge progress={Math.min(100, pct)} size={size} color={tier.color}>
        <Text style={{ color: colors.ink, fontFamily: fontFamily.extrabold, fontSize: 26 }}>{formatPercent(pct)}</Text>
        <Text style={{ color: colors.inkMuted, fontFamily: fontFamily.semibold, fontSize: 11 }}>used</Text>
      </RadialGauge>
      <View style={{ flex: 1, gap: 10 }}>
        <View
          style={{
            alignSelf: 'flex-start',
            paddingHorizontal: 10,
            paddingVertical: 4,
            borderRadius: 999,
            backgroundColor: `${tier.color}22`,
          }}
        >
          <Text style={{ color: tier.color, fontFamily: fontFamily.bold, fontSize: 11 }}>{tier.label.toUpperCase()}</Text>
        </View>
        <View>
          <Text style={{ color: colors.inkMuted, fontFamily: fontFamily.medium, fontSize: 12 }}>Spent this period</Text>
          <Text style={{ color: colors.ink, fontFamily: fontFamily.bold, fontSize: 17 }}>{formatCompactCurrency(spent)}</Text>
        </View>
        <View>
          <Text style={{ color: colors.inkMuted, fontFamily: fontFamily.medium, fontSize: 12 }}>Remaining</Text>
          <Text style={{ color: colors.primary400, fontFamily: fontFamily.bold, fontSize: 17 }}>
            {formatCompactCurrency(remaining)}
          </Text>
        </View>
      </View>
    </View>
  );
}
