import { ReactNode, useMemo, useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { TrendingUp, TrendingDown, ChevronRight, Waves } from 'lucide-react-native';
import { AnalyticsIcon, TrophyIcon } from '@/components/ui/icons/ImageIcon';
import { Screen } from '@/components/ui/Screen';
import { GlassCard } from '@/components/ui/GlassCard';
import { LiquidGlassSurface } from '@/components/ui/LiquidGlassSurface';
import { Skeleton } from '@/components/ui/Skeleton';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { DonutChart } from '@/components/charts/DonutChart';
import { LineTrendChart } from '@/components/charts/LineTrendChart';
import { HeatMapCalendar } from '@/components/charts/HeatMapCalendar';
import { colors, fontFamily, liquidGlass } from '@/theme/tokens';
import { formatCurrency, formatCompactCurrency, formatPercent } from '@/utils/format';
import { getCategory } from '@/constants/categories';
import { AnalyticsStackParamList } from '@/navigation/types';
import { useGetAnalyticsSummaryQuery, useGetAnalyticsCategoriesQuery, useGetAnalyticsTrendsQuery } from '@/store/api/analyticsApi';
import { useListTransactionsQuery } from '@/store/api/transactionsApi';

type Nav = NativeStackNavigationProp<AnalyticsStackParamList>;

type RangeOption = 'Week' | 'Month' | 'Year';
const RANGE_DAYS: Record<RangeOption, number> = { Week: 7, Month: 30, Year: 365 };

function StatTile({ label, value, delta, deltaGood }: { label: string; value: number; delta: number; deltaGood: boolean }) {
  const positive = delta >= 0;
  return (
    <View style={{ flex: 1, gap: 4 }}>
      <Text style={{ color: colors.inkMuted, fontFamily: fontFamily.semibold, fontSize: 11.5 }}>{label}</Text>
      <Text style={{ color: colors.ink, fontFamily: fontFamily.extrabold, fontSize: 16.5 }}>{formatCompactCurrency(value)}</Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
        {positive ? (
          <TrendingUp size={11} color={deltaGood ? colors.primary400 : colors.tierOrange} />
        ) : (
          <TrendingDown size={11} color={deltaGood ? colors.primary400 : colors.tierOrange} />
        )}
        <Text style={{ color: deltaGood ? colors.primary400 : colors.tierOrange, fontFamily: fontFamily.bold, fontSize: 11 }}>
          {formatPercent(Math.abs(delta))}
        </Text>
      </View>
    </View>
  );
}

function QuickNavRow({ icon, label, subtitle, onPress }: { icon: ReactNode; label: string; subtitle: string; onPress: () => void }) {
  return (
    <GlassCard onPress={onPress}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16 }}>
        <LiquidGlassSurface
          radius={13}
          borderWidth={1.1}
          intensity={liquidGlass.blurButton}
          contentStyle={{ width: 42, height: 42, alignItems: 'center', justifyContent: 'center' }}
        >
          {icon}
        </LiquidGlassSurface>
        <View style={{ flex: 1 }}>
          <Text style={{ color: colors.ink, fontFamily: fontFamily.bold, fontSize: 14.5 }}>{label}</Text>
          <Text style={{ color: colors.inkMuted, fontFamily: fontFamily.medium, fontSize: 12, marginTop: 1 }}>{subtitle}</Text>
        </View>
        <ChevronRight size={18} color={colors.inkMuted} />
      </View>
    </GlassCard>
  );
}

export function AnalyticsDashboardScreen() {
  const navigation = useNavigation<Nav>();
  const [range, setRange] = useState<RangeOption>('Month');
  const days = RANGE_DAYS[range];
  const rangeLabel = range.toLowerCase();

  const { data: summary, isLoading: summaryLoading } = useGetAnalyticsSummaryQuery();
  const { data: categories, isLoading: categoriesLoading } = useGetAnalyticsCategoriesQuery();
  const { data: trends, isLoading: trendsLoading } = useGetAnalyticsTrendsQuery({ days });
  const { data: txnData } = useListTransactionsQuery({ limit: 100 });

  const heatmapDays = useMemo(() => {
    const today = new Date();
    const byDay = new Map<string, number>();
    (txnData?.transactions ?? []).forEach((t) => {
      if (t.type !== 'expense') return;
      const key = new Date(t.transactionAt).toISOString().slice(0, 10);
      byDay.set(key, (byDay.get(key) ?? 0) + t.amount);
    });
    const out: { date: string; amount: number }[] = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      out.push({ date: key, amount: byDay.get(key) ?? 0 });
    }
    return out;
  }, [txnData]);

  const donutData = (categories ?? []).map((c) => ({
    label: getCategory(c.category).label,
    value: c.amount,
    color: getCategory(c.category).color,
  }));

  const totalCategorySpend = (categories ?? []).reduce((sum, c) => sum + c.amount, 0);

  const trendPoints = (trends ?? []).map((t) => ({ date: t.date, value: t.amount }));
  const comparisonPoints = (trends ?? []).map((t) => ({ date: t.date, value: t.priorPeriodAmount ?? 0 }));

  const isLoading = summaryLoading || categoriesLoading;

  return (
    <Screen scroll>
      <View style={{ paddingHorizontal: 20, paddingTop: 4, gap: 18 }}>
        <Animated.View entering={FadeInDown.springify()}>
          <Text style={{ color: colors.ink, fontFamily: fontFamily.extrabold, fontSize: 22 }}>Analytics</Text>
          <Text style={{ color: colors.inkMuted, fontFamily: fontFamily.medium, fontSize: 13, marginTop: 2 }}>
            {summary?.periodLabel ?? 'This month'} money story
          </Text>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(40).springify()}>
          <SegmentedControl options={['Week', 'Month', 'Year']} value={range} onChange={(v) => setRange(v as RangeOption)} />
        </Animated.View>

        {isLoading || !summary ? (
          <Skeleton height={90} radius={20} />
        ) : (
          <Animated.View entering={FadeInUp.delay(80).springify()}>
            <GlassCard>
              <View style={{ flexDirection: 'row', padding: 18 }}>
                <StatTile label="Income" value={summary.income} delta={summary.incomeDelta} deltaGood={summary.incomeDelta >= 0} />
                <StatTile label="Expenses" value={summary.expense} delta={summary.expenseDelta} deltaGood={summary.expenseDelta <= 0} />
                <StatTile label="Savings" value={summary.savings} delta={summary.savingsDelta} deltaGood={summary.savingsDelta >= 0} />
              </View>
            </GlassCard>
          </Animated.View>
        )}

        <Animated.View entering={FadeInUp.delay(120).springify()}>
          <Text style={{ color: colors.ink, fontFamily: fontFamily.bold, fontSize: 16, marginBottom: 12 }}>Spend by category</Text>
          <GlassCard>
            <View style={{ padding: 18, gap: 18 }}>
              {categoriesLoading || !categories ? (
                <Skeleton height={180} radius={90} />
              ) : (
                <>
                  <View style={{ alignItems: 'center' }}>
                    <DonutChart
                      data={donutData}
                      centerValue={formatCompactCurrency(totalCategorySpend)}
                      centerLabel="Total spend"
                      onSegmentPress={(i) => {
                        const cat = (categories ?? [])[i];
                        if (cat) navigation.navigate('CategoryDrilldown', { category: cat.category });
                      }}
                    />
                  </View>
                  <View style={{ gap: 12 }}>
                    {categories.map((c) => {
                      const cat = getCategory(c.category);
                      const Icon = cat.icon;
                      return (
                        <Pressable
                          key={c.category}
                          onPress={() => navigation.navigate('CategoryDrilldown', { category: c.category })}
                          style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}
                        >
                          <LiquidGlassSurface
                            radius={14}
                            borderWidth={1.1}
                            intensity={liquidGlass.blurButton}
                            contentStyle={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}
                          >
                            <Icon size={26} color={cat.color} />
                          </LiquidGlassSurface>
                          <Text style={{ flex: 1, color: colors.ink, fontFamily: fontFamily.semibold, fontSize: 13.5 }} numberOfLines={1}>
                            {cat.label}
                          </Text>
                          <Text style={{ color: colors.inkMuted, fontFamily: fontFamily.medium, fontSize: 12 }}>
                            {formatPercent(c.pctOfTotal)}
                          </Text>
                          <Text style={{ color: colors.ink, fontFamily: fontFamily.bold, fontSize: 13, minWidth: 74, textAlign: 'right' }}>
                            {formatCurrency(c.amount)}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </>
              )}
            </View>
          </GlassCard>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(160).springify()}>
          <Text style={{ color: colors.ink, fontFamily: fontFamily.bold, fontSize: 16, marginBottom: 12 }}>
            Spending trend vs last {rangeLabel}
          </Text>
          <GlassCard>
            <View style={{ padding: 18 }}>
              {trendsLoading || !trends ? (
                <Skeleton height={180} />
              ) : (
                <LineTrendChart points={trendPoints} comparisonPoints={comparisonPoints} height={180} />
              )}
              <View style={{ flexDirection: 'row', gap: 16, marginTop: 12 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primary500 }} />
                  <Text style={{ color: colors.inkSecondary, fontFamily: fontFamily.medium, fontSize: 11.5 }}>This {rangeLabel}</Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: colors.inkMuted }} />
                  <Text style={{ color: colors.inkSecondary, fontFamily: fontFamily.medium, fontSize: 11.5 }}>Last {rangeLabel}</Text>
                </View>
              </View>
            </View>
          </GlassCard>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(200).springify()}>
          <Text style={{ color: colors.ink, fontFamily: fontFamily.bold, fontSize: 16, marginBottom: 12 }}>Daily spend, last 30 days</Text>
          <GlassCard>
            <View style={{ padding: 18 }}>
              <HeatMapCalendar days={heatmapDays} />
            </View>
          </GlassCard>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(240).springify()} style={{ gap: 12 }}>
          <Text style={{ color: colors.ink, fontFamily: fontFamily.bold, fontSize: 16 }}>Explore further</Text>
          <QuickNavRow
            icon={<AnalyticsIcon size={26} color={colors.primary400} />}
            label="Monthly Report"
            subtitle="Full category breakdown & trends"
            onPress={() => navigation.navigate('MonthlyReport')}
          />
          <QuickNavRow
            icon={<TrophyIcon size={26} color={colors.primary400} />}
            label="Year in Review"
            subtitle="Your money recap"
            onPress={() => navigation.navigate('YearInReview')}
          />
          <QuickNavRow
            icon={<Waves size={19} color={colors.primary400} />}
            label="Cash Flow"
            subtitle="Income to savings waterfall"
            onPress={() => navigation.navigate('CashFlow')}
          />
        </Animated.View>
      </View>
    </Screen>
  );
}
