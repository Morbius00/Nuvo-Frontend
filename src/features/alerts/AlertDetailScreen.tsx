import { useMemo } from 'react';
import { View, Text } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Animated, { FadeInDown, FadeInUp, ZoomIn } from 'react-native-reanimated';
import { AlertTriangle, ShieldAlert, ShieldX, TrendingDown, type LucideIcon } from 'lucide-react-native';
import { Screen } from '@/components/ui/Screen';
import { GlassCard } from '@/components/ui/GlassCard';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { GlassButton } from '@/components/ui/GlassButton';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Skeleton } from '@/components/ui/Skeleton';
import { colors, fontFamily, stopLossTiers } from '@/theme/tokens';
import { formatCurrency, formatPercent } from '@/utils/format';
import { getCategory } from '@/constants/categories';
import { RootStackParamList } from '@/navigation/types';
import { useGetCurrentBudgetQuery } from '@/store/api/budgetsApi';
import { useCrossNavigation } from '@/hooks/useCrossNavigation';

type Nav = NativeStackNavigationProp<RootStackParamList, 'AlertDetail'>;
type Rt = RouteProp<RootStackParamList, 'AlertDetail'>;

const FALLBACK_TOP_CATEGORIES = ['Food & Dining', 'Shopping', 'Transportation'];

interface TierContent {
  label: string;
  color: string;
  Icon: LucideIcon;
  headline: string;
  message: string;
  recoveryPlan: string[];
}

export function AlertDetailScreen() {
  const navigation = useNavigation<Nav>();
  const crossNav = useCrossNavigation();
  const { params } = useRoute<Rt>();
  const { data: budget, isLoading } = useGetCurrentBudgetQuery();

  const utilisation = budget && budget.totalBudget > 0 ? (budget.totalSpent / budget.totalBudget) * 100 : 0;
  const remaining = budget ? Math.max(0, budget.totalBudget - budget.totalSpent) : 0;

  const topCategories = useMemo(() => {
    if (!budget || budget.categoryBreakdown.length === 0) return FALLBACK_TOP_CATEGORIES;
    return [...budget.categoryBreakdown]
      .sort((a, b) => b.spent - a.spent)
      .slice(0, 3)
      .map((c) => getCategory(c.category).label);
  }, [budget]);

  const content: TierContent = useMemo(() => {
    if (params.tier === 'predictive') {
      const dailyTarget = budget ? Math.max(0, Math.round(remaining / 5)) : 0;
      return {
        label: 'Predictive Alert',
        color: colors.tierOrange,
        Icon: TrendingDown,
        headline: 'LUNA forecasts a budget breach',
        message: `At your current pace, LUNA forecasts you’ll breach your ${
          budget ? formatCurrency(budget.totalBudget) : 'monthly'
        } budget within 5 days.`,
        recoveryPlan: [
          `Cap spending at ${budget ? formatCurrency(dailyTarget) : '—'}/day for the rest of the month.`,
          'Hold off on impulse purchases for the next 3 days.',
          `Revisit your ${topCategories[0]} budget — it's driving most of the pace.`,
        ],
      };
    }

    const tier = stopLossTiers.find((t) => t.key === params.tier) ?? stopLossTiers[stopLossTiers.length - 1];
    const recoveryTarget = budget ? Math.max(0, budget.totalSpent - budget.totalBudget * 0.75) : 0;

    const byTier: Record<string, Omit<TierContent, 'label' | 'color'>> = {
      yellow: {
        Icon: AlertTriangle,
        headline: 'Halfway through your budget',
        message: `You’ve crossed 50% of your ${budget ? formatCurrency(budget.totalBudget) : 'monthly'} budget. Here’s a tip for your highest-spend category — ${topCategories[0]}.`,
        recoveryPlan: [
          `Keep an eye on ${topCategories[0]} — it's your biggest spend area this month.`,
          'Set a soft personal alert at 65% so nothing sneaks up on you.',
          'Review recurring subscriptions for a quick, easy win.',
        ],
      },
      orange: {
        Icon: ShieldAlert,
        headline: `${formatPercent(utilisation)} of budget used`,
        message: `You’ve used ${formatPercent(utilisation)}+ of your budget. LUNA projects you’ll finish the month over budget. Top 3 categories to reduce: ${topCategories.join(', ')}.`,
        recoveryPlan: [
          `Pause non-essential ${topCategories[0]} spend for the rest of the week.`,
          `Trim ${topCategories[1] ?? 'discretionary'} purchases — even a 20% cut helps.`,
          `Delay big-ticket ${topCategories[2] ?? 'purchases'} to next month's cycle.`,
        ],
      },
      red: {
        Icon: ShieldAlert,
        headline: 'Critical — 90%+ used',
        message: `You’ve used ${formatPercent(utilisation)} of your budget — critical. Here’s a personalised recovery plan to bring you back under 75%.`,
        recoveryPlan: [
          `Move ${budget ? formatCurrency(recoveryTarget) : 'the overage'} out of discretionary categories to get back under 75%.`,
          'Freeze all non-essential spend for the next 5 days.',
          'Review and cancel any unused subscriptions today.',
        ],
      },
      hard: {
        Icon: ShieldX,
        headline: 'Hard stop-loss limit reached',
        message: `You’ve hit your hard stop-loss limit of ${budget ? formatCurrency(budget.stopLoss.limit) : 'your set amount'}. Full recovery plan below.`,
        recoveryPlan: [
          'Every new transaction will now be flagged for review.',
          'LUNA will alert you before any further spend goes through.',
          'Consider revisiting your limit in Stop-Loss Settings if this keeps happening.',
        ],
      },
    };

    return { label: tier.label, color: tier.color, ...byTier[tier.key] };
  }, [params.tier, budget, utilisation, remaining, topCategories]);

  const Icon = content.Icon;

  const goToBudget = () => {
    crossNav.toTab('HomeTab', 'Home');
    navigation.goBack();
  };

  return (
    <Screen scroll>
      <View style={{ paddingHorizontal: 20, paddingTop: 8, gap: 20 }}>
        <Animated.View entering={ZoomIn.springify().delay(40)} style={{ alignItems: 'center', marginTop: 12 }}>
          <GlassCard radius={999} glow={content.color} style={{ width: 100, height: 100 }}>
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
              <Icon size={42} color={content.color} />
            </View>
          </GlassCard>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(120).springify()} style={{ alignItems: 'center', gap: 6 }}>
          <Text style={{ color: content.color, fontFamily: fontFamily.bold, fontSize: 12.5, letterSpacing: 0.4 }}>
            {content.label.toUpperCase()}
          </Text>
          <Text style={{ color: colors.ink, fontFamily: fontFamily.extrabold, fontSize: 22, textAlign: 'center' }}>
            {content.headline}
          </Text>
        </Animated.View>

        {isLoading || !budget ? (
          <GlassCard>
            <View style={{ padding: 20, gap: 12 }}>
              <Skeleton height={14} />
              <Skeleton height={10} />
            </View>
          </GlassCard>
        ) : (
          <Animated.View entering={FadeInUp.delay(160).springify()}>
            <GlassCard>
              <View style={{ padding: 18, gap: 12 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={{ color: colors.inkSecondary, fontFamily: fontFamily.semibold, fontSize: 12.5 }}>
                    {formatCurrency(budget.totalSpent)} of {formatCurrency(budget.totalBudget)}
                  </Text>
                  <Text style={{ color: content.color, fontFamily: fontFamily.bold, fontSize: 12.5 }}>
                    {formatPercent(utilisation)}
                  </Text>
                </View>
                <ProgressBar progress={utilisation} color={content.color} />
                <Text style={{ color: colors.inkMuted, fontFamily: fontFamily.medium, fontSize: 12 }}>
                  {formatCurrency(remaining)} remaining this month
                </Text>
              </View>
            </GlassCard>
          </Animated.View>
        )}

        <Animated.View entering={FadeInUp.delay(200).springify()}>
          <GlassCard>
            <View style={{ padding: 18, gap: 10 }}>
              <Text style={{ color: colors.primary400, fontFamily: fontFamily.bold, fontSize: 11.5 }}>
                LUNA SAYS
              </Text>
              <Text style={{ color: colors.ink, fontFamily: fontFamily.medium, fontSize: 14.5, lineHeight: 21 }}>
                {content.message}
              </Text>
            </View>
          </GlassCard>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(240).springify()}>
          <GlassCard>
            <View style={{ padding: 18, gap: 12 }}>
              <Text style={{ color: colors.inkSecondary, fontFamily: fontFamily.semibold, fontSize: 12.5 }}>
                RECOVERY PLAN
              </Text>
              {content.recoveryPlan.map((line, idx) => (
                <View key={idx} style={{ flexDirection: 'row', gap: 10, alignItems: 'flex-start' }}>
                  <View
                    style={{
                      width: 20,
                      height: 20,
                      borderRadius: 6,
                      backgroundColor: `${content.color}22`,
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginTop: 1,
                    }}
                  >
                    <Text style={{ color: content.color, fontFamily: fontFamily.bold, fontSize: 11 }}>{idx + 1}</Text>
                  </View>
                  <Text style={{ color: colors.ink, fontFamily: fontFamily.medium, fontSize: 13.5, lineHeight: 19, flex: 1 }}>
                    {line}
                  </Text>
                </View>
              ))}
            </View>
          </GlassCard>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(280).springify()} style={{ gap: 12, marginTop: 4 }}>
          <PrimaryButton label="View Budget" onPress={goToBudget} />
          <GlassButton label="Got it" onPress={() => navigation.goBack()} />
        </Animated.View>
      </View>
    </Screen>
  );
}
