import { View, Text, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { ArrowLeft, Wallet, PiggyBank, CreditCard, PieChart, Target, TrendingUp, TrendingDown } from 'lucide-react-native';
import { Screen } from '@/components/ui/Screen';
import { GlassCard } from '@/components/ui/GlassCard';
import { IconButton } from '@/components/ui/IconButton';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { RadialGauge } from '@/components/charts/RadialGauge';
import { RadarChart } from '@/components/charts/RadarChart';
import { Skeleton } from '@/components/ui/Skeleton';
import { colors, fontFamily, shadow, healthGradient, bgAuroraCyan } from '@/theme/tokens';
import { formatDay } from '@/utils/format';
import { HomeStackParamList } from '@/navigation/types';
import { useGetHealthScoreQuery } from '@/store/api/analyticsApi';

type Nav = NativeStackNavigationProp<HomeStackParamList>;

const GAUGE_GRADIENT = [colors.lime400, colors.cyan400] as const;
const BAR_GRADIENT = [colors.sapGreen600, colors.lime400] as const;

const COMPONENTS = [
  {
    key: 'budgetAdherence',
    label: 'Budget Adherence',
    max: 250,
    icon: Wallet,
    description: 'How many of the last 12 months you stayed within your set budget.',
  },
  {
    key: 'savingsRate',
    label: 'Savings Rate',
    max: 250,
    icon: PiggyBank,
    description: 'The share of this month’s income you kept as savings instead of spending.',
  },
  {
    key: 'debtManagement',
    label: 'Debt & EMI Management',
    max: 200,
    icon: CreditCard,
    description: 'How much of your income goes toward EMIs and loan payments.',
  },
  {
    key: 'spendingDiversity',
    label: 'Spending Diversity',
    max: 150,
    icon: PieChart,
    description: 'How evenly your spending is spread across categories, rather than concentrated in one.',
  },
  {
    key: 'goalProgress',
    label: 'Goal Progress',
    max: 150,
    icon: Target,
    description: 'How close you are to hitting the targets on your active savings goals.',
  },
] as const;

function scoreLabel(score: number) {
  if (score >= 800)
    return { label: 'Excellent', color: colors.primary400, description: 'You’re excelling across budgeting, saving, and goals — keep it up.' };
  if (score >= 650)
    return { label: 'Good', color: colors.primary500, description: 'Solid money habits overall, with room to improve in a category or two below.' };
  if (score >= 450)
    return { label: 'Fair', color: colors.tierYellow, description: 'Mixed habits — focus on your lowest-scoring area below to improve fastest.' };
  return { label: 'Needs Work', color: colors.tierOrange, description: 'A few areas need attention — start with the lowest score below.' };
}

export function SpendHealthScreen() {
  const navigation = useNavigation<Nav>();
  const { data, isLoading } = useGetHealthScoreQuery();
  const score = data?.current.score ?? 0;
  const band = scoreLabel(score);
  const maxBarHeight = 56;
  const trendStart = data?.history[0]?.score;
  const trendDelta = data && trendStart !== undefined ? score - trendStart : 0;

  return (
    <Screen scroll auroraExtra={bgAuroraCyan}>
      <View style={{ paddingHorizontal: 20, paddingTop: 4, gap: 20 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <IconButton variant="glass" size={42} icon={<ArrowLeft size={19} color={colors.ink} />} onPress={() => navigation.goBack()} />
          <View style={{ flex: 1 }}>
            <Text style={{ color: colors.ink, fontFamily: fontFamily.extrabold, fontSize: 19 }}>Financial Health Score</Text>
            <Text style={{ color: colors.inkMuted, fontFamily: fontFamily.medium, fontSize: 12 }}>
              One 0–1000 score built from 5 weighted money habits
            </Text>
          </View>
        </View>
        <LinearGradient colors={healthGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ height: 3, borderRadius: 2, marginTop: -12 }} />

        {isLoading || !data ? (
          <Skeleton height={220} radius={28} />
        ) : (
          <>
            <Animated.View entering={FadeInUp.springify()} style={shadow.glow(colors.cyan400)}>
              <GlassCard glow={band.color}>
                <View style={{ alignItems: 'center', padding: 28, gap: 8 }}>
                  <RadialGauge progress={(score / 1000) * 100} size={190} strokeWidth={16} color={band.color} colors={GAUGE_GRADIENT}>
                    <Text style={{ color: colors.ink, fontFamily: fontFamily.extrabold, fontSize: 40 }}>{score}</Text>
                    <Text style={{ color: colors.inkMuted, fontFamily: fontFamily.semibold, fontSize: 12 }}>out of 1000</Text>
                  </RadialGauge>
                  <View
                    style={{
                      marginTop: 8,
                      paddingHorizontal: 14,
                      paddingVertical: 6,
                      borderRadius: 999,
                      backgroundColor: `${band.color}22`,
                    }}
                  >
                    <Text style={{ color: band.color, fontFamily: fontFamily.bold, fontSize: 13 }}>{band.label}</Text>
                  </View>
                  <Text
                    style={{
                      color: colors.inkSecondary,
                      fontFamily: fontFamily.medium,
                      fontSize: 12.5,
                      textAlign: 'center',
                      marginTop: 2,
                      paddingHorizontal: 12,
                    }}
                  >
                    {band.description}
                  </Text>
                </View>
              </GlassCard>
            </Animated.View>

            <Animated.View entering={FadeInUp.delay(80).springify()}>
              <Text style={{ color: colors.ink, fontFamily: fontFamily.bold, fontSize: 16, marginBottom: 4 }}>
                Score breakdown
              </Text>
              <Text style={{ color: colors.inkMuted, fontFamily: fontFamily.medium, fontSize: 12, marginBottom: 12 }}>
                The 5 habits that make up your score, and how you’re doing on each.
              </Text>
              <GlassCard>
                <View style={{ padding: 18, gap: 18 }}>
                  <View style={{ alignItems: 'center' }}>
                    <RadarChart
                      size={220}
                      color={band.color}
                      gradientColors={GAUGE_GRADIENT}
                      data={COMPONENTS.map((c) => ({ label: c.label, value: data.current.components[c.key], max: c.max }))}
                    />
                  </View>
                  <View style={{ height: 1, backgroundColor: colors.hairline }} />
                  {COMPONENTS.map((c) => {
                    const Icon = c.icon;
                    const value = data.current.components[c.key];
                    return (
                      <View key={c.key} style={{ gap: 6 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                          <Icon size={15} color={colors.primary400} />
                          <Text style={{ flex: 1, color: colors.ink, fontFamily: fontFamily.semibold, fontSize: 13.5 }}>
                            {c.label}
                          </Text>
                          <Text style={{ color: colors.inkMuted, fontFamily: fontFamily.bold, fontSize: 12.5 }}>
                            {value}/{c.max}
                          </Text>
                        </View>
                        <Text style={{ color: colors.inkMuted, fontFamily: fontFamily.medium, fontSize: 11.5, lineHeight: 15 }}>
                          {c.description}
                        </Text>
                        <ProgressBar progress={(value / c.max) * 100} gradient={BAR_GRADIENT} />
                      </View>
                    );
                  })}
                </View>
              </GlassCard>
            </Animated.View>

            <Animated.View entering={FadeInUp.delay(160).springify()}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                <Text style={{ color: colors.ink, fontFamily: fontFamily.bold, fontSize: 16 }}>30-day trend</Text>
                {trendDelta !== 0 && (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    {trendDelta > 0 ? (
                      <TrendingUp size={14} color={colors.lime400} />
                    ) : (
                      <TrendingDown size={14} color={colors.tierOrange} />
                    )}
                    <Text
                      style={{
                        color: trendDelta > 0 ? colors.lime400 : colors.tierOrange,
                        fontFamily: fontFamily.bold,
                        fontSize: 12.5,
                      }}
                    >
                      {trendDelta > 0 ? '+' : ''}
                      {trendDelta} pts vs 30 days ago
                    </Text>
                  </View>
                )}
              </View>
              <Text style={{ color: colors.inkMuted, fontFamily: fontFamily.medium, fontSize: 12, marginBottom: 12 }}>
                Your daily Financial Health Score over the last month — taller bars are stronger days.
              </Text>
              <GlassCard>
                <View style={{ padding: 18 }}>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 5, height: maxBarHeight }}>
                      {data.history.map((h, i) => {
                        const isToday = i === data.history.length - 1;
                        return (
                          <LinearGradient
                            key={h._id}
                            colors={isToday ? [colors.cyan500, colors.cyan400] : BAR_GRADIENT}
                            start={{ x: 0, y: 1 }}
                            end={{ x: 0, y: 0 }}
                            style={{
                              width: 6,
                              height: Math.max(4, (h.score / 1000) * maxBarHeight),
                              borderRadius: 3,
                            }}
                          />
                        );
                      })}
                    </View>
                  </ScrollView>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 }}>
                    <Text style={{ color: colors.inkMuted, fontFamily: fontFamily.medium, fontSize: 11 }}>
                      {data.history[0] ? formatDay(data.history[0].date) : ''}
                    </Text>
                    <Text style={{ color: colors.cyan400, fontFamily: fontFamily.semibold, fontSize: 11 }}>Today</Text>
                  </View>
                </View>
              </GlassCard>
            </Animated.View>
          </>
        )}
      </View>
    </Screen>
  );
}
