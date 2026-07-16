import { View, Text } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { ArrowLeft, Calendar, Sparkles, TrendingUp, Check, Target } from 'lucide-react-native';
import { Screen } from '@/components/ui/Screen';
import { GlassCard } from '@/components/ui/GlassCard';
import { IconButton } from '@/components/ui/IconButton';
import { Badge } from '@/components/ui/Chip';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { RadialGauge } from '@/components/charts/RadialGauge';
import { colors, fontFamily } from '@/theme/tokens';
import { formatCurrency, formatDayYear } from '@/utils/format';
import { LunaStackParamList } from '@/navigation/types';
import { useListGoalsQuery } from '@/store/api/aiApi';
import { GoalStatus } from '@/types';

type Nav = NativeStackNavigationProp<LunaStackParamList>;
type GoalDetailRoute = RouteProp<LunaStackParamList, 'GoalDetail'>;

const STATUS_META: Record<GoalStatus, { label: string; color: string }> = {
  on_track: { label: 'On Track', color: colors.primary500 },
  ahead: { label: 'Ahead', color: colors.primary400 },
  behind: { label: 'Behind', color: colors.tierOrange },
  completed: { label: 'Completed', color: colors.primary600 },
  abandoned: { label: 'Abandoned', color: colors.inkMuted },
};

export function GoalDetailScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<GoalDetailRoute>();
  const { data: goals, isLoading } = useListGoalsQuery();
  const goal = goals?.find((g) => g._id === route.params.id);

  const pct = goal && goal.targetAmount > 0 ? Math.min(100, (goal.savedAmount / goal.targetAmount) * 100) : 0;
  const statusMeta = goal ? STATUS_META[goal.status] : undefined;

  return (
    <Screen scroll>
      <View style={{ paddingHorizontal: 20, paddingTop: 4, gap: 20 }}>
        <Animated.View entering={FadeInDown.springify()} style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <IconButton variant="glass" size={42} icon={<ArrowLeft size={19} color={colors.ink} />} onPress={() => navigation.goBack()} />
          <View style={{ flex: 1 }}>
            <Text style={{ color: colors.ink, fontFamily: fontFamily.extrabold, fontSize: 19 }} numberOfLines={1}>
              {goal?.name ?? 'Goal'}
            </Text>
            <Text style={{ color: colors.inkMuted, fontFamily: fontFamily.medium, fontSize: 12.5 }}>Goal details</Text>
          </View>
          {statusMeta && <Badge label={statusMeta.label} subtle color={statusMeta.color} />}
        </Animated.View>

        {isLoading && (
          <GlassCard>
            <View style={{ padding: 20 }}>
              <Skeleton height={240} />
            </View>
          </GlassCard>
        )}

        {!isLoading && !goal && (
          <EmptyState
            icon={<Target size={28} color={colors.primary400} />}
            title="Goal not found"
            subtitle="This goal may have been removed or is no longer available."
          />
        )}

        {goal && (
          <>
            <Animated.View entering={FadeInUp.delay(80).springify()} style={{ alignItems: 'center', marginTop: 4 }}>
              <RadialGauge progress={pct} size={220} strokeWidth={18} color={statusMeta?.color ?? colors.primary500}>
                <Text style={{ color: colors.ink, fontFamily: fontFamily.extrabold, fontSize: 36 }}>{Math.round(pct)}%</Text>
                <Text style={{ color: colors.inkMuted, fontFamily: fontFamily.semibold, fontSize: 12.5, marginTop: 2 }}>
                  saved
                </Text>
              </RadialGauge>
            </Animated.View>

            <Animated.View entering={FadeInUp.delay(120).springify()}>
              <GlassCard>
                <View style={{ flexDirection: 'row', padding: 18 }}>
                  <View style={{ flex: 1, alignItems: 'center' }}>
                    <Text style={{ color: colors.inkMuted, fontFamily: fontFamily.semibold, fontSize: 11 }}>Saved</Text>
                    <Text style={{ color: colors.ink, fontFamily: fontFamily.bold, fontSize: 14.5, marginTop: 3 }}>
                      {formatCurrency(goal.savedAmount)}
                    </Text>
                  </View>
                  <View style={{ width: 1, backgroundColor: colors.hairline }} />
                  <View style={{ flex: 1, alignItems: 'center' }}>
                    <Text style={{ color: colors.inkMuted, fontFamily: fontFamily.semibold, fontSize: 11 }}>Target</Text>
                    <Text style={{ color: colors.ink, fontFamily: fontFamily.bold, fontSize: 14.5, marginTop: 3 }}>
                      {formatCurrency(goal.targetAmount)}
                    </Text>
                  </View>
                  <View style={{ width: 1, backgroundColor: colors.hairline }} />
                  <View style={{ flex: 1, alignItems: 'center' }}>
                    <Text style={{ color: colors.inkMuted, fontFamily: fontFamily.semibold, fontSize: 11 }}>Remaining</Text>
                    <Text style={{ color: colors.ink, fontFamily: fontFamily.bold, fontSize: 14.5, marginTop: 3 }}>
                      {formatCurrency(Math.max(0, goal.targetAmount - goal.savedAmount))}
                    </Text>
                  </View>
                </View>
              </GlassCard>
            </Animated.View>

            <Animated.View entering={FadeInUp.delay(160).springify()}>
              <GlassCard>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16 }}>
                  <View
                    style={{
                      width: 38,
                      height: 38,
                      borderRadius: 12,
                      backgroundColor: colors.glassFillStrong,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Calendar size={17} color={colors.inkSecondary} />
                  </View>
                  <View>
                    <Text style={{ color: colors.inkMuted, fontFamily: fontFamily.semibold, fontSize: 11 }}>Target date</Text>
                    <Text style={{ color: colors.ink, fontFamily: fontFamily.bold, fontSize: 14.5, marginTop: 2 }}>
                      {formatDayYear(goal.targetDate)}
                    </Text>
                  </View>
                </View>
              </GlassCard>
            </Animated.View>

            {goal.aiPlan && (
              <Animated.View entering={FadeInUp.delay(200).springify()}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                  <Sparkles size={16} color={colors.primary400} />
                  <Text style={{ color: colors.ink, fontFamily: fontFamily.bold, fontSize: 16 }}>LUNA's Plan</Text>
                </View>
                <GlassCard glow={colors.primary500}>
                  <View style={{ padding: 18, gap: 16 }}>
                    <View>
                      <Text style={{ color: colors.inkSecondary, fontFamily: fontFamily.semibold, fontSize: 12.5 }}>
                        Required monthly savings
                      </Text>
                      <Text style={{ color: colors.ink, fontFamily: fontFamily.extrabold, fontSize: 27, marginTop: 3 }}>
                        {formatCurrency(goal.aiPlan.requiredMonthlySavings)}/mo
                      </Text>
                    </View>

                    {goal.aiPlan.projectedCompletionDate && (
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <TrendingUp size={15} color={colors.primary400} />
                        <Text style={{ color: colors.inkSecondary, fontFamily: fontFamily.medium, fontSize: 13 }}>
                          Projected completion:{' '}
                          <Text style={{ color: colors.ink, fontFamily: fontFamily.bold }}>
                            {formatDayYear(goal.aiPlan.projectedCompletionDate)}
                          </Text>
                        </Text>
                      </View>
                    )}

                    {goal.aiPlan.recommendations.length > 0 && (
                      <View style={{ gap: 10 }}>
                        <Text style={{ color: colors.inkSecondary, fontFamily: fontFamily.semibold, fontSize: 12.5 }}>
                          Recommendations
                        </Text>
                        {goal.aiPlan.recommendations.map((rec, i) => (
                          <View key={i} style={{ flexDirection: 'row', gap: 10, alignItems: 'flex-start' }}>
                            <View
                              style={{
                                width: 20,
                                height: 20,
                                borderRadius: 6,
                                backgroundColor: `${colors.primary500}22`,
                                alignItems: 'center',
                                justifyContent: 'center',
                                marginTop: 1,
                              }}
                            >
                              <Check size={12} color={colors.primary400} />
                            </View>
                            <Text style={{ flex: 1, color: colors.inkSecondary, fontFamily: fontFamily.medium, fontSize: 13, lineHeight: 19 }}>
                              {rec}
                            </Text>
                          </View>
                        ))}
                      </View>
                    )}
                  </View>
                </GlassCard>
              </Animated.View>
            )}
          </>
        )}
      </View>
    </Screen>
  );
}
