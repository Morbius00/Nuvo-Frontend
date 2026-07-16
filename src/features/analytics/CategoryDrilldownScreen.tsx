import { useMemo } from 'react';
import { View, Text } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { ArrowLeft } from 'lucide-react-native';
import { Screen } from '@/components/ui/Screen';
import { GlassCard } from '@/components/ui/GlassCard';
import { IconButton } from '@/components/ui/IconButton';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { AnimatedNumber } from '@/components/ui/AnimatedNumber';
import { LineTrendChart } from '@/components/charts/LineTrendChart';
import { ScatterAnomalyChart } from '@/components/charts/ScatterAnomalyChart';
import { TransactionRow } from '@/components/cards/TransactionRow';
import { colors, fontFamily } from '@/theme/tokens';
import { formatCurrency, formatPercent, groupByDay } from '@/utils/format';
import { getCategory } from '@/constants/categories';
import { AnalyticsStackParamList } from '@/navigation/types';
import { useGetAnalyticsCategoriesQuery } from '@/store/api/analyticsApi';
import { useListTransactionsQuery } from '@/store/api/transactionsApi';
import { useCrossNavigation } from '@/hooks/useCrossNavigation';

type Nav = NativeStackNavigationProp<AnalyticsStackParamList>;
type Rt = RouteProp<AnalyticsStackParamList, 'CategoryDrilldown'>;

export function CategoryDrilldownScreen() {
  const navigation = useNavigation<Nav>();
  const crossNav = useCrossNavigation();
  const route = useRoute<Rt>();
  const { category } = route.params;
  const cat = getCategory(category);
  const Icon = cat.icon;

  const { data: categories, isLoading: categoriesLoading } = useGetAnalyticsCategoriesQuery();
  const { data: txnData, isLoading: txnLoading } = useListTransactionsQuery({ category, limit: 50 });

  const categoryStats = categories?.find((c) => c.category === category);

  const sparklinePoints = useMemo(() => {
    const transactions = txnData?.transactions ?? [];
    const byDay = new Map<string, number>();
    transactions.forEach((t) => {
      const key = new Date(t.transactionAt).toISOString().slice(0, 10);
      byDay.set(key, (byDay.get(key) ?? 0) + t.amount);
    });
    return Array.from(byDay.entries())
      .sort(([a], [b]) => (a < b ? -1 : 1))
      .map(([date, value]) => ({ date, value }));
  }, [txnData]);

  const groupedTransactions = useMemo(
    () => groupByDay(txnData?.transactions ?? [], (t) => t.transactionAt),
    [txnData],
  );

  const scatterTransactions = useMemo(
    () => [...(txnData?.transactions ?? [])].sort((a, b) => (a.transactionAt < b.transactionAt ? -1 : 1)),
    [txnData],
  );
  const anomalyCount = scatterTransactions.filter((t) => t.isAnomalous).length;

  const pct = categoryStats && categoryStats.budgeted > 0 ? (categoryStats.amount / categoryStats.budgeted) * 100 : 0;
  const over = !!categoryStats && categoryStats.amount > categoryStats.budgeted;

  return (
    <Screen scroll>
      <View style={{ paddingHorizontal: 20, paddingTop: 4, gap: 20 }}>
        <Animated.View entering={FadeInDown.springify()} style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <IconButton variant="glass" size={42} icon={<ArrowLeft size={19} color={colors.ink} />} onPress={() => navigation.goBack()} />
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
            <View
              style={{
                width: 38,
                height: 38,
                borderRadius: 12,
                backgroundColor: `${cat.color}22`,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Icon size={19} color={cat.color} />
            </View>
            <Text style={{ color: colors.ink, fontFamily: fontFamily.extrabold, fontSize: 19 }} numberOfLines={1}>
              {cat.label}
            </Text>
          </View>
        </Animated.View>

        {categoriesLoading ? (
          <Skeleton height={140} radius={20} />
        ) : (
          <Animated.View entering={FadeInUp.delay(60).springify()}>
            <GlassCard glow={cat.color}>
              <View style={{ padding: 20, gap: 14 }}>
                <Text style={{ color: colors.inkMuted, fontFamily: fontFamily.semibold, fontSize: 12 }}>Spent this period</Text>
                <AnimatedNumber
                  value={categoryStats?.amount ?? 0}
                  formatter={(n) => formatCurrency(n)}
                  style={{ color: colors.ink, fontFamily: fontFamily.extrabold, fontSize: 32 }}
                />
                {categoryStats && (
                  <>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                      <Text style={{ color: colors.inkSecondary, fontFamily: fontFamily.medium, fontSize: 12.5 }}>
                        {formatPercent(categoryStats.pctOfTotal)} of total spend · {categoryStats.count} txns
                      </Text>
                      <Text style={{ color: colors.inkMuted, fontFamily: fontFamily.medium, fontSize: 12.5 }}>
                        Budget {formatCurrency(categoryStats.budgeted)}
                      </Text>
                    </View>
                    <ProgressBar progress={pct} color={over ? colors.tierRed : cat.color} />
                  </>
                )}
                {sparklinePoints.length > 1 && (
                  <View style={{ marginTop: 6 }}>
                    <LineTrendChart points={sparklinePoints} color={cat.color} height={90} showArea />
                  </View>
                )}
              </View>
            </GlassCard>
          </Animated.View>
        )}

        {scatterTransactions.length > 2 && (
          <Animated.View entering={FadeInUp.delay(100).springify()} style={{ gap: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Text style={{ color: colors.ink, fontFamily: fontFamily.bold, fontSize: 16 }}>Transaction amounts</Text>
              {anomalyCount > 0 && (
                <Text style={{ color: colors.danger400, fontFamily: fontFamily.bold, fontSize: 11.5 }}>
                  {anomalyCount} flagged unusual
                </Text>
              )}
            </View>
            <GlassCard>
              <View style={{ padding: 18 }}>
                <ScatterAnomalyChart
                  points={scatterTransactions.map((t) => ({ date: t.transactionAt, amount: t.amount, isAnomalous: t.isAnomalous }))}
                  onPointPress={(i) => crossNav.toTab('TransactionsTab', 'TransactionDetail', { id: scatterTransactions[i]._id })}
                  height={140}
                />
              </View>
            </GlassCard>
          </Animated.View>
        )}

        <Animated.View entering={FadeInUp.delay(120).springify()} style={{ gap: 12 }}>
          <Text style={{ color: colors.ink, fontFamily: fontFamily.bold, fontSize: 16 }}>Transactions</Text>
          {txnLoading ? (
            <Skeleton height={200} radius={20} />
          ) : groupedTransactions.length === 0 ? (
            <GlassCard>
              <EmptyState
                icon={<Icon size={30} color={cat.color} />}
                title="No transactions yet"
                subtitle={`Nothing tagged as ${cat.label} in this period.`}
              />
            </GlassCard>
          ) : (
            groupedTransactions.map((group) => (
              <View key={group.title} style={{ gap: 6 }}>
                <Text style={{ color: colors.inkMuted, fontFamily: fontFamily.bold, fontSize: 11.5, marginLeft: 4, textTransform: 'uppercase' }}>
                  {group.title}
                </Text>
                <GlassCard>
                  <View style={{ paddingHorizontal: 16 }}>
                    {group.data.map((t, idx) => (
                      <View key={t._id} style={idx > 0 ? { borderTopWidth: 1, borderTopColor: colors.hairline } : undefined}>
                        <TransactionRow
                          transaction={t}
                          onPress={() => crossNav.toTab('TransactionsTab', 'TransactionDetail', { id: t._id })}
                        />
                      </View>
                    ))}
                  </View>
                </GlassCard>
              </View>
            ))
          )}
        </Animated.View>
      </View>
    </Screen>
  );
}
