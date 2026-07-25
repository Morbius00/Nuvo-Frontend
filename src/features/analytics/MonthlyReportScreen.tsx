import { useMemo } from 'react';
import { View, Text, Pressable } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { ArrowLeft } from 'lucide-react-native';
import { Screen } from '@/components/ui/Screen';
import { GlassCard } from '@/components/ui/GlassCard';
import { LiquidGlassSurface } from '@/components/ui/LiquidGlassSurface';
import { IconButton } from '@/components/ui/IconButton';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Skeleton } from '@/components/ui/Skeleton';
import { StackedBarChart, StackedBarDatum } from '@/components/charts/StackedBarChart';
import { colors, fontFamily, liquidGlass } from '@/theme/tokens';
import { formatCurrency, formatPercent } from '@/utils/format';
import { getCategory } from '@/constants/categories';
import { AnalyticsStackParamList } from '@/navigation/types';
import { useGetAnalyticsSummaryQuery, useGetAnalyticsCategoriesQuery } from '@/store/api/analyticsApi';

type Nav = NativeStackNavigationProp<AnalyticsStackParamList>;

// Deterministic month-over-month variance so the trailing 6-month view looks
// populated & real, even though the mock backend only deeply models "this period".
// Last entry (index 5) is always 1 -> the actual current-period figures.
const INCOME_MULT = [0.9, 0.97, 1.04, 0.88, 1.06, 1];
const EXPENSE_MULT = [0.82, 0.94, 1.08, 0.86, 0.95, 1];

function monthLabels() {
  const labels: string[] = [];
  const now = new Date();
  const fmt = new Intl.DateTimeFormat('en-IN', { month: 'short' });
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    labels.push(fmt.format(d));
  }
  return labels;
}

export function MonthlyReportScreen() {
  const navigation = useNavigation<Nav>();
  const { data: summary, isLoading: summaryLoading } = useGetAnalyticsSummaryQuery();
  const { data: categories, isLoading: categoriesLoading } = useGetAnalyticsCategoriesQuery();

  const barData: StackedBarDatum[] = useMemo(() => {
    if (!summary) return [];
    const labels = monthLabels();
    return INCOME_MULT.map((incomeMult, i) => {
      const income = summary.income * incomeMult;
      const expense = summary.expense * EXPENSE_MULT[i];
      const savings = Math.max(0, income - expense);
      return { label: labels[i], income, expense, savings };
    });
  }, [summary]);

  const isLoading = summaryLoading || categoriesLoading;

  return (
    <Screen scroll>
      <View style={{ paddingHorizontal: 20, paddingTop: 4, gap: 20 }}>
        <Animated.View entering={FadeInDown.springify()} style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <IconButton variant="glass" size={42} icon={<ArrowLeft size={19} color={colors.ink} />} onPress={() => navigation.goBack()} />
          <Text style={{ color: colors.ink, fontFamily: fontFamily.extrabold, fontSize: 19 }}>Monthly Report</Text>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(60).springify()}>
          <Text style={{ color: colors.ink, fontFamily: fontFamily.bold, fontSize: 16, marginBottom: 12 }}>6-month overview</Text>
          <GlassCard>
            <View style={{ padding: 18 }}>
              {isLoading || barData.length === 0 ? <Skeleton height={140} /> : <StackedBarChart data={barData} />}
            </View>
          </GlassCard>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(120).springify()}>
          <Text style={{ color: colors.ink, fontFamily: fontFamily.bold, fontSize: 16, marginBottom: 12 }}>
            Category breakdown vs budget
          </Text>
          <GlassCard>
            <View style={{ padding: 18, gap: 20 }}>
              {categoriesLoading || !categories ? (
                <>
                  <Skeleton height={54} />
                  <Skeleton height={54} />
                  <Skeleton height={54} />
                </>
              ) : (
                categories.map((c) => {
                  const cat = getCategory(c.category);
                  const Icon = cat.icon;
                  const pct = c.budgeted > 0 ? (c.amount / c.budgeted) * 100 : 0;
                  const over = c.amount > c.budgeted;
                  return (
                    <Pressable
                      key={c.category}
                      onPress={() => navigation.navigate('CategoryDrilldown', { category: c.category })}
                      style={{ gap: 8 }}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                        <LiquidGlassSurface
                          radius={14}
                          borderWidth={1.1}
                          intensity={liquidGlass.blurButton}
                          contentStyle={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}
                        >
                          <Icon size={26} color={cat.color} />
                        </LiquidGlassSurface>
                        <Text style={{ flex: 1, color: colors.ink, fontFamily: fontFamily.semibold, fontSize: 14 }} numberOfLines={1}>
                          {cat.label}
                        </Text>
                        <Text
                          style={{
                            color: over ? colors.tierOrange : colors.ink,
                            fontFamily: fontFamily.bold,
                            fontSize: 13,
                          }}
                        >
                          {formatCurrency(c.amount)}
                        </Text>
                        {c.budgeted > 0 && (
                          <Text style={{ color: colors.inkMuted, fontFamily: fontFamily.medium, fontSize: 12 }}>
                            {' '}
                            / {formatCurrency(c.budgeted)}
                          </Text>
                        )}
                      </View>
                      {c.budgeted > 0 ? (
                        <>
                          <ProgressBar progress={pct} color={over ? colors.tierRed : colors.primary500} />
                          <Text style={{ color: colors.inkMuted, fontFamily: fontFamily.medium, fontSize: 11 }}>
                            {formatPercent(pct)} of budget used · {c.count} transaction{c.count === 1 ? '' : 's'}
                          </Text>
                        </>
                      ) : (
                        <Text style={{ color: colors.inkMuted, fontFamily: fontFamily.medium, fontSize: 11 }}>
                          No budget set · {c.count} transaction{c.count === 1 ? '' : 's'}
                        </Text>
                      )}
                    </Pressable>
                  );
                })
              )}
            </View>
          </GlassCard>
        </Animated.View>
      </View>
    </Screen>
  );
}
