import { View, Text, ScrollView } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { colors, fontFamily } from '@/theme/tokens';

export interface StackedBarDatum {
  label: string;
  income: number;
  expense: number;
  savings: number;
}

interface StackedBarChartProps {
  data: StackedBarDatum[];
  height?: number;
}

const INCOME_COLOR = colors.primary400;
const EXPENSE_COLOR = colors.tierOrange;
const SAVINGS_COLOR = colors.lime500;

const LEGEND: readonly [string, string][] = [
  ['Income', INCOME_COLOR],
  ['Expense', EXPENSE_COLOR],
  ['Savings', SAVINGS_COLOR],
];

/** Vertical bars per period, stacked & color-segmented by income/expense/savings. */
export function StackedBarChart({ data, height = 140 }: StackedBarChartProps) {
  const max = Math.max(1, ...data.map((d) => d.income + d.expense + d.savings));

  return (
    <View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 6, gap: 20, alignItems: 'flex-end' }}
      >
        {data.map((d, i) => {
          const incomeH = (d.income / max) * height;
          const expenseH = (d.expense / max) * height;
          const savingsH = (d.savings / max) * height;
          return (
            <Animated.View
              key={`${d.label}-${i}`}
              entering={FadeInUp.delay(i * 70).springify()}
              style={{ alignItems: 'center', gap: 8, width: 38 }}
            >
              <View style={{ height, width: 24, flexDirection: 'column-reverse', gap: 2 }}>
                {d.income > 0 && (
                  <View style={{ height: incomeH, width: '100%', backgroundColor: INCOME_COLOR, borderRadius: 4 }} />
                )}
                {d.expense > 0 && (
                  <View style={{ height: expenseH, width: '100%', backgroundColor: EXPENSE_COLOR, borderRadius: 4 }} />
                )}
                {d.savings > 0 && (
                  <View style={{ height: savingsH, width: '100%', backgroundColor: SAVINGS_COLOR, borderRadius: 4 }} />
                )}
              </View>
              <Text style={{ color: colors.inkMuted, fontFamily: fontFamily.semibold, fontSize: 11 }}>{d.label}</Text>
            </Animated.View>
          );
        })}
      </ScrollView>
      <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 16, marginTop: 14 }}>
        {LEGEND.map(([label, color]) => (
          <View key={label} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: color }} />
            <Text style={{ color: colors.inkSecondary, fontFamily: fontFamily.medium, fontSize: 11 }}>{label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}
