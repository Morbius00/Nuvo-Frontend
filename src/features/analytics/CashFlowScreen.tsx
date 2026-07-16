import { useMemo } from 'react';
import { View, Text } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { ArrowLeft } from 'lucide-react-native';
import { Screen } from '@/components/ui/Screen';
import { GlassCard } from '@/components/ui/GlassCard';
import { LiquidGlassSurface } from '@/components/ui/LiquidGlassSurface';
import { IconButton } from '@/components/ui/IconButton';
import { Skeleton } from '@/components/ui/Skeleton';
import { WaterfallChart, WaterfallStep } from '@/components/charts/WaterfallChart';
import { colors, fontFamily, liquidGlass } from '@/theme/tokens';
import { formatCurrency } from '@/utils/format';
import { getCategory } from '@/constants/categories';
import { AnalyticsStackParamList } from '@/navigation/types';
import { useGetAnalyticsSummaryQuery, useGetAnalyticsCategoriesQuery } from '@/store/api/analyticsApi';

type Nav = NativeStackNavigationProp<AnalyticsStackParamList>;

export function CashFlowScreen() {
  const navigation = useNavigation<Nav>();
  const { data: summary, isLoading: summaryLoading } = useGetAnalyticsSummaryQuery();
  const { data: categories, isLoading: categoriesLoading } = useGetAnalyticsCategoriesQuery();

  const steps: WaterfallStep[] = useMemo(() => {
    if (!summary || !categories) return [];
    return [
      { label: 'Income', value: summary.income, type: 'start' },
      ...categories.map((c) => ({ label: getCategory(c.category).label, value: c.amount, type: 'negative' as const })),
      { label: 'Net Savings', value: summary.savings, type: 'end' as const },
    ];
  }, [summary, categories]);

  const isLoading = summaryLoading || categoriesLoading;

  return (
    <Screen scroll>
      <View style={{ paddingHorizontal: 20, paddingTop: 4, gap: 20 }}>
        <Animated.View entering={FadeInDown.springify()} style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <IconButton variant="glass" size={42} icon={<ArrowLeft size={19} color={colors.ink} />} onPress={() => navigation.goBack()} />
          <Text style={{ color: colors.ink, fontFamily: fontFamily.extrabold, fontSize: 19 }}>Cash Flow</Text>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(60).springify()}>
          <Text style={{ color: colors.inkMuted, fontFamily: fontFamily.medium, fontSize: 13, lineHeight: 19 }}>
            How your {summary?.periodLabel?.toLowerCase() ?? 'monthly'} income flows out across categories, down to what you kept.
          </Text>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(100).springify()}>
          <GlassCard>
            <View style={{ paddingVertical: 12 }}>
              {isLoading || steps.length === 0 ? <Skeleton height={220} /> : <WaterfallChart steps={steps} />}
            </View>
          </GlassCard>
        </Animated.View>

        {!isLoading && summary && (
          <Animated.View entering={FadeInUp.delay(140).springify()}>
            <GlassCard>
              <View style={{ flexDirection: 'row', padding: 18 }}>
                <View style={{ flex: 1, gap: 4 }}>
                  <Text style={{ color: colors.inkMuted, fontFamily: fontFamily.semibold, fontSize: 11.5 }}>Income</Text>
                  <Text style={{ color: colors.primary400, fontFamily: fontFamily.extrabold, fontSize: 16 }}>
                    {formatCurrency(summary.income)}
                  </Text>
                </View>
                <View style={{ flex: 1, gap: 4 }}>
                  <Text style={{ color: colors.inkMuted, fontFamily: fontFamily.semibold, fontSize: 11.5 }}>Expenses</Text>
                  <Text style={{ color: colors.tierOrange, fontFamily: fontFamily.extrabold, fontSize: 16 }}>
                    {formatCurrency(summary.expense)}
                  </Text>
                </View>
                <View style={{ flex: 1, gap: 4 }}>
                  <Text style={{ color: colors.inkMuted, fontFamily: fontFamily.semibold, fontSize: 11.5 }}>Net Savings</Text>
                  <Text style={{ color: colors.primary500, fontFamily: fontFamily.extrabold, fontSize: 16 }}>
                    {formatCurrency(summary.savings)}
                  </Text>
                </View>
              </View>
            </GlassCard>
          </Animated.View>
        )}

        {!isLoading && categories && categories.length > 0 && (
          <Animated.View entering={FadeInUp.delay(180).springify()} style={{ gap: 12 }}>
            <Text style={{ color: colors.ink, fontFamily: fontFamily.bold, fontSize: 16 }}>Where it went</Text>
            <GlassCard>
              <View style={{ padding: 18, gap: 14 }}>
                {categories.map((c) => {
                  const cat = getCategory(c.category);
                  const Icon = cat.icon;
                  return (
                    <View key={c.category} style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
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
                      <Text style={{ color: colors.tierOrange, fontFamily: fontFamily.bold, fontSize: 13 }}>
                        -{formatCurrency(c.amount)}
                      </Text>
                    </View>
                  );
                })}
              </View>
            </GlassCard>
          </Animated.View>
        )}
      </View>
    </Screen>
  );
}
