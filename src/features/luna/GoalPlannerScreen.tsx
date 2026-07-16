import { useRef, useState } from 'react';
import { View, Text } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { BottomSheetModal } from '@gorhom/bottom-sheet';
import { addMonths } from 'date-fns';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { ArrowLeft, Plus, ChevronRight, Sparkles, Target } from 'lucide-react-native';
import { Screen } from '@/components/ui/Screen';
import { GlassCard } from '@/components/ui/GlassCard';
import { IconButton } from '@/components/ui/IconButton';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { Input } from '@/components/ui/Input';
import { Chip, Badge } from '@/components/ui/Chip';
import { GlassBottomSheet } from '@/components/ui/GlassBottomSheet';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { RadialGauge } from '@/components/charts/RadialGauge';
import { colors, fontFamily } from '@/theme/tokens';
import { formatCurrency, formatDayYear } from '@/utils/format';
import { LunaStackParamList } from '@/navigation/types';
import { useListGoalsQuery, useCreateGoalMutation } from '@/store/api/aiApi';
import { Goal, GoalStatus } from '@/types';

type Nav = NativeStackNavigationProp<LunaStackParamList>;

const STATUS_META: Record<GoalStatus, { label: string; color: string }> = {
  on_track: { label: 'On Track', color: colors.primary500 },
  ahead: { label: 'Ahead', color: colors.primary400 },
  behind: { label: 'Behind', color: colors.tierOrange },
  completed: { label: 'Completed', color: colors.primary600 },
  abandoned: { label: 'Abandoned', color: colors.inkMuted },
};

const TIMEFRAMES = [
  { label: '6 months', months: 6 },
  { label: '1 year', months: 12 },
  { label: '18 months', months: 18 },
  { label: '2 years', months: 24 },
  { label: '3 years', months: 36 },
];

function GoalCard({ goal, index, onPress }: { goal: Goal; index: number; onPress: () => void }) {
  const pct = goal.targetAmount > 0 ? Math.min(100, (goal.savedAmount / goal.targetAmount) * 100) : 0;
  const meta = STATUS_META[goal.status];

  return (
    <Animated.View entering={FadeInUp.delay(60 * index).springify()}>
      <GlassCard onPress={onPress}>
        <View style={{ flexDirection: 'row', gap: 14, padding: 16, alignItems: 'center' }}>
          <RadialGauge progress={pct} size={58} strokeWidth={6} color={meta.color}>
            <Text style={{ color: colors.ink, fontFamily: fontFamily.bold, fontSize: 12.5 }}>{Math.round(pct)}%</Text>
          </RadialGauge>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Text style={{ flex: 1, color: colors.ink, fontFamily: fontFamily.bold, fontSize: 15 }} numberOfLines={1}>
                {goal.name}
              </Text>
              <Badge label={meta.label} subtle color={meta.color} />
            </View>
            <Text style={{ color: colors.inkSecondary, fontFamily: fontFamily.medium, fontSize: 12.5, marginTop: 4 }}>
              {formatCurrency(goal.savedAmount)} of {formatCurrency(goal.targetAmount)}
            </Text>
            <Text style={{ color: colors.inkMuted, fontFamily: fontFamily.medium, fontSize: 11.5, marginTop: 2 }}>
              Target {formatDayYear(goal.targetDate)}
            </Text>
          </View>
          <ChevronRight size={18} color={colors.inkMuted} />
        </View>
      </GlassCard>
    </Animated.View>
  );
}

export function GoalPlannerScreen() {
  const navigation = useNavigation<Nav>();
  const { data: goals, isLoading } = useListGoalsQuery();
  const [createGoal, { isLoading: isCreating }] = useCreateGoalMutation();

  const sheetRef = useRef<BottomSheetModal>(null);
  const [name, setName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [months, setMonths] = useState(12);
  const [createdGoal, setCreatedGoal] = useState<Goal | null>(null);

  const resetForm = () => {
    setName('');
    setTargetAmount('');
    setMonths(12);
    setCreatedGoal(null);
  };

  const handleCreate = async () => {
    const amount = Number(targetAmount);
    if (!name.trim() || !amount) return;
    const targetDate = addMonths(new Date(), months).toISOString();
    try {
      const goal = await createGoal({ name: name.trim(), targetAmount: amount, targetDate }).unwrap();
      setCreatedGoal(goal);
    } catch {
      // mock server does not reject — swallow defensively
    }
  };

  return (
    <Screen scroll>
      <View style={{ paddingHorizontal: 20, paddingTop: 4, gap: 18 }}>
        <Animated.View entering={FadeInDown.springify()} style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <IconButton variant="glass" size={42} icon={<ArrowLeft size={19} color={colors.ink} />} onPress={() => navigation.goBack()} />
          <View style={{ flex: 1 }}>
            <Text style={{ color: colors.ink, fontFamily: fontFamily.extrabold, fontSize: 22 }}>Goal Planner</Text>
            <Text style={{ color: colors.inkMuted, fontFamily: fontFamily.medium, fontSize: 12.5 }}>
              LUNA's reverse-budgeted savings plans
            </Text>
          </View>
          <IconButton
            size={42}
            icon={<Plus size={20} color={colors.ink} />}
            onPress={() => sheetRef.current?.present()}
          />
        </Animated.View>

        {isLoading && (
          <View style={{ gap: 14 }}>
            {[0, 1, 2].map((i) => (
              <GlassCard key={i}>
                <View style={{ padding: 16 }}>
                  <Skeleton height={70} />
                </View>
              </GlassCard>
            ))}
          </View>
        )}

        {!isLoading && goals?.length === 0 && (
          <EmptyState
            icon={<Target size={28} color={colors.primary400} />}
            title="No goals yet"
            subtitle="Create your first goal and LUNA will reverse-budget a monthly plan to reach it."
            action={<PrimaryButton label="New Goal" onPress={() => sheetRef.current?.present()} fullWidth={false} style={{ marginTop: 8 }} />}
          />
        )}

        {!isLoading && goals && goals.length > 0 && (
          <View style={{ gap: 14 }}>
            {goals.map((goal, idx) => (
              <GoalCard key={goal._id} goal={goal} index={idx} onPress={() => navigation.navigate('GoalDetail', { id: goal._id })} />
            ))}
          </View>
        )}
      </View>

      <GlassBottomSheet ref={sheetRef} onDismiss={resetForm}>
        {!createdGoal ? (
          <View style={{ gap: 16, paddingTop: 8 }}>
            <View>
              <Text style={{ color: colors.ink, fontFamily: fontFamily.extrabold, fontSize: 19 }}>New Goal</Text>
              <Text style={{ color: colors.inkMuted, fontFamily: fontFamily.medium, fontSize: 12.5, lineHeight: 18, marginTop: 4 }}>
                Tell LUNA what you're saving for — she'll reverse-budget a monthly plan to get you there.
              </Text>
            </View>
            <Input label="Goal name" value={name} onChangeText={setName} placeholder="e.g. New Laptop" />
            <Input
              label="Target amount (₹)"
              value={targetAmount}
              onChangeText={setTargetAmount}
              keyboardType="number-pad"
              placeholder="100000"
            />
            <View>
              <Text style={{ color: colors.inkSecondary, fontFamily: fontFamily.semibold, fontSize: 13, marginBottom: 8 }}>
                Target timeframe
              </Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {TIMEFRAMES.map((tf) => (
                  <Chip key={tf.months} label={tf.label} selected={months === tf.months} onPress={() => setMonths(tf.months)} />
                ))}
              </View>
            </View>
            <PrimaryButton
              label="Create Goal"
              loading={isCreating}
              disabled={!name.trim() || !targetAmount.trim()}
              onPress={handleCreate}
              style={{ marginTop: 4 }}
            />
          </View>
        ) : (
          <View style={{ gap: 14, paddingTop: 8, paddingBottom: 4, alignItems: 'center' }}>
            <View
              style={{ width: 56, height: 56, borderRadius: 18, backgroundColor: colors.primary500, alignItems: 'center', justifyContent: 'center' }}
            >
              <Sparkles size={24} color={colors.inkOnPrimary} />
            </View>
            <Text style={{ color: colors.ink, fontFamily: fontFamily.extrabold, fontSize: 18, textAlign: 'center' }}>
              Goal created!
            </Text>
            <Text style={{ color: colors.inkSecondary, fontFamily: fontFamily.medium, fontSize: 13, textAlign: 'center', lineHeight: 19 }}>
              LUNA's plan: save {formatCurrency(createdGoal.aiPlan?.requiredMonthlySavings ?? 0)}/month to reach{' '}
              {formatCurrency(createdGoal.targetAmount)} by {formatDayYear(createdGoal.targetDate)}.
            </Text>
            <PrimaryButton label="Done" onPress={() => sheetRef.current?.dismiss()} style={{ marginTop: 6 }} />
          </View>
        )}
      </GlassBottomSheet>
    </Screen>
  );
}
