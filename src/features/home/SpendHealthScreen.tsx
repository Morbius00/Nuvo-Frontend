import { View, Text, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { ArrowLeft, Wallet, PiggyBank, CreditCard, PieChart, Target } from 'lucide-react-native';
import { Screen } from '@/components/ui/Screen';
import { GlassCard } from '@/components/ui/GlassCard';
import { IconButton } from '@/components/ui/IconButton';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { RadialGauge } from '@/components/charts/RadialGauge';
import { Skeleton } from '@/components/ui/Skeleton';
import { colors, fontFamily } from '@/theme/tokens';
import { HomeStackParamList } from '@/navigation/types';
import { useGetHealthScoreQuery } from '@/store/api/analyticsApi';

type Nav = NativeStackNavigationProp<HomeStackParamList>;

const COMPONENTS = [
  { key: 'budgetAdherence', label: 'Budget Adherence', max: 250, icon: Wallet },
  { key: 'savingsRate', label: 'Savings Rate', max: 250, icon: PiggyBank },
  { key: 'debtManagement', label: 'Debt & EMI Management', max: 200, icon: CreditCard },
  { key: 'spendingDiversity', label: 'Spending Diversity', max: 150, icon: PieChart },
  { key: 'goalProgress', label: 'Goal Progress', max: 150, icon: Target },
] as const;

function scoreLabel(score: number) {
  if (score >= 800) return { label: 'Excellent', color: colors.primary400 };
  if (score >= 650) return { label: 'Good', color: colors.primary500 };
  if (score >= 450) return { label: 'Fair', color: colors.tierYellow };
  return { label: 'Needs Work', color: colors.tierOrange };
}

export function SpendHealthScreen() {
  const navigation = useNavigation<Nav>();
  const { data, isLoading } = useGetHealthScoreQuery();
  const score = data?.current.score ?? 0;
  const band = scoreLabel(score);
  const maxBarHeight = 40;

  return (
    <Screen scroll>
      <View style={{ paddingHorizontal: 20, paddingTop: 4, gap: 20 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <IconButton variant="glass" size={42} icon={<ArrowLeft size={19} color={colors.ink} />} onPress={() => navigation.goBack()} />
          <Text style={{ color: colors.ink, fontFamily: fontFamily.extrabold, fontSize: 19 }}>Financial Health Score</Text>
        </View>

        {isLoading || !data ? (
          <Skeleton height={220} radius={28} />
        ) : (
          <>
            <Animated.View entering={FadeInUp.springify()}>
              <GlassCard glow={band.color}>
                <View style={{ alignItems: 'center', padding: 28, gap: 8 }}>
                  <RadialGauge progress={(score / 1000) * 100} size={190} strokeWidth={16} color={band.color}>
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
                </View>
              </GlassCard>
            </Animated.View>

            <Animated.View entering={FadeInUp.delay(80).springify()}>
              <Text style={{ color: colors.ink, fontFamily: fontFamily.bold, fontSize: 16, marginBottom: 12 }}>
                Score breakdown
              </Text>
              <GlassCard>
                <View style={{ padding: 18, gap: 18 }}>
                  {COMPONENTS.map((c) => {
                    const Icon = c.icon;
                    const value = data.current.components[c.key];
                    return (
                      <View key={c.key} style={{ gap: 8 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                          <Icon size={15} color={colors.primary400} />
                          <Text style={{ flex: 1, color: colors.ink, fontFamily: fontFamily.semibold, fontSize: 13.5 }}>
                            {c.label}
                          </Text>
                          <Text style={{ color: colors.inkMuted, fontFamily: fontFamily.bold, fontSize: 12.5 }}>
                            {value}/{c.max}
                          </Text>
                        </View>
                        <ProgressBar progress={(value / c.max) * 100} color={colors.primary500} />
                      </View>
                    );
                  })}
                </View>
              </GlassCard>
            </Animated.View>

            <Animated.View entering={FadeInUp.delay(160).springify()}>
              <Text style={{ color: colors.ink, fontFamily: fontFamily.bold, fontSize: 16, marginBottom: 12 }}>
                30-day trend
              </Text>
              <GlassCard>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ padding: 18 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 5, height: maxBarHeight }}>
                    {data.history.map((h) => (
                      <View
                        key={h._id}
                        style={{
                          width: 6,
                          height: Math.max(4, (h.score / 1000) * maxBarHeight),
                          borderRadius: 3,
                          backgroundColor: colors.primary500,
                          opacity: 0.55,
                        }}
                      />
                    ))}
                  </View>
                </ScrollView>
              </GlassCard>
            </Animated.View>
          </>
        )}
      </View>
    </Screen>
  );
}
