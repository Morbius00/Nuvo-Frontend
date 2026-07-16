import { useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Animated, { FadeInRight, FadeOutLeft } from 'react-native-reanimated';
import { ArrowLeft, Shield, TrendingUp, Rocket, Plane, PiggyBank, CreditCard, LineChart, Receipt } from 'lucide-react-native';
import { Screen } from '@/components/ui/Screen';
import { GlassCard } from '@/components/ui/GlassCard';
import { Chip } from '@/components/ui/Chip';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { IconButton } from '@/components/ui/IconButton';
import { Input } from '@/components/ui/Input';
import { colors, fontFamily, radii } from '@/theme/tokens';
import { OnboardingStackParamList } from '@/navigation/types';
import { useUpdateProfileMutation } from '@/store/api';
import { RiskTolerance } from '@/types';

type Nav = NativeStackNavigationProp<OnboardingStackParamList>;

const RISK_OPTIONS: { key: RiskTolerance; label: string; desc: string; icon: typeof Shield }[] = [
  { key: 'low', label: 'Play it safe', desc: 'Protect what I have — minimal risk', icon: Shield },
  { key: 'medium', label: 'Balanced', desc: 'Steady growth with some risk', icon: TrendingUp },
  { key: 'high', label: 'Go big', desc: 'Comfortable with high risk for high reward', icon: Rocket },
];

const GOAL_OPTIONS = [
  { key: 'Travel more', icon: Plane },
  { key: 'Build an emergency fund', icon: PiggyBank },
  { key: 'Pay off debt', icon: CreditCard },
  { key: 'Start investing', icon: LineChart },
  { key: 'Reduce dining out spend', icon: Receipt },
];

const BUDGET_PRESETS = [20000, 35000, 45000, 75000];

export function OnboardingScreen() {
  const navigation = useNavigation<Nav>();
  const [step, setStep] = useState(0);
  const [risk, setRisk] = useState<RiskTolerance>('medium');
  const [goals, setGoals] = useState<string[]>(['Build an emergency fund']);
  const [monthlyBudget, setMonthlyBudget] = useState('45000');
  const [stopLossAmount, setStopLossAmount] = useState('50000');
  const [updateProfile, { isLoading }] = useUpdateProfileMutation();

  const totalSteps = 3;

  const toggleGoal = (g: string) => {
    setGoals((prev) => (prev.includes(g) ? prev.filter((x) => x !== g) : prev.length < 4 ? [...prev, g] : prev));
  };

  const onBack = () => {
    if (step === 0) navigation.goBack();
    else setStep((s) => s - 1);
  };

  const onNext = async () => {
    if (step < totalSteps - 1) {
      setStep((s) => s + 1);
      return;
    }
    await updateProfile({
      monthlyBudget: Number(monthlyBudget) || 0,
      stopLossAmount: Number(stopLossAmount) || 0,
      aiProfile: { riskTolerance: risk, financialGoals: goals, spendingPersona: 'Balanced Planner' },
    }).unwrap().catch(() => undefined);
    navigation.navigate('BiometricSetup');
  };

  return (
    <Screen scroll>
      <View style={{ paddingHorizontal: 24, paddingTop: 8, minHeight: 560 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <IconButton variant="glass" size={42} icon={<ArrowLeft size={19} color={colors.ink} />} onPress={onBack} />
          <View style={{ flex: 1, flexDirection: 'row', gap: 6 }}>
            {Array.from({ length: totalSteps }).map((_, i) => (
              <View
                key={i}
                style={{
                  flex: 1,
                  height: 5,
                  borderRadius: 3,
                  backgroundColor: i <= step ? colors.primary500 : colors.glassFillStrong,
                }}
              />
            ))}
          </View>
        </View>

        {step === 0 && (
          <Animated.View entering={FadeInRight.springify()} exiting={FadeOutLeft} style={{ marginTop: 28 }}>
            <Text style={{ color: colors.ink, fontFamily: fontFamily.extrabold, fontSize: 26 }}>
              What’s your investing style?
            </Text>
            <Text style={{ color: colors.inkSecondary, fontFamily: fontFamily.medium, fontSize: 14, marginTop: 6 }}>
              LUNA tailors advice to your risk tolerance
            </Text>

            <View style={{ marginTop: 24, gap: 12 }}>
              {RISK_OPTIONS.map((opt) => {
                const Icon = opt.icon;
                const selected = risk === opt.key;
                return (
                  <GlassCard key={opt.key} onPress={() => setRisk(opt.key)} bordered radius={radii.lg} style={selected ? { borderColor: colors.primary500 } : undefined}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16 }}>
                      <View
                        style={{
                          width: 44,
                          height: 44,
                          borderRadius: 14,
                          backgroundColor: selected ? colors.primary500 : colors.glassFillStrong,
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Icon size={20} color={selected ? colors.inkOnPrimary : colors.inkSecondary} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={{ color: colors.ink, fontFamily: fontFamily.bold, fontSize: 15 }}>{opt.label}</Text>
                        <Text style={{ color: colors.inkMuted, fontFamily: fontFamily.medium, fontSize: 12, marginTop: 2 }}>
                          {opt.desc}
                        </Text>
                      </View>
                    </View>
                  </GlassCard>
                );
              })}
            </View>
          </Animated.View>
        )}

        {step === 1 && (
          <Animated.View entering={FadeInRight.springify()} exiting={FadeOutLeft} style={{ marginTop: 28 }}>
            <Text style={{ color: colors.ink, fontFamily: fontFamily.extrabold, fontSize: 26 }}>What are you working toward?</Text>
            <Text style={{ color: colors.inkSecondary, fontFamily: fontFamily.medium, fontSize: 14, marginTop: 6 }}>
              Pick up to 4 — LUNA will build plans around these
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 24 }}>
              {GOAL_OPTIONS.map((g) => (
                <Chip key={g.key} label={g.key} selected={goals.includes(g.key)} onPress={() => toggleGoal(g.key)} />
              ))}
            </View>
          </Animated.View>
        )}

        {step === 2 && (
          <Animated.View entering={FadeInRight.springify()} exiting={FadeOutLeft} style={{ marginTop: 28, gap: 20 }}>
            <View>
              <Text style={{ color: colors.ink, fontFamily: fontFamily.extrabold, fontSize: 26 }}>Set your monthly budget</Text>
              <Text style={{ color: colors.inkSecondary, fontFamily: fontFamily.medium, fontSize: 14, marginTop: 6 }}>
                You can fine-tune this anytime in Settings
              </Text>
            </View>

            <Input
              label="Monthly budget (₹)"
              value={monthlyBudget}
              onChangeText={setMonthlyBudget}
              keyboardType="number-pad"
              placeholder="45000"
            />
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {BUDGET_PRESETS.map((p) => (
                <Chip key={p} label={`₹${p / 1000}K`} selected={monthlyBudget === String(p)} onPress={() => setMonthlyBudget(String(p))} />
              ))}
            </View>

            <Input
              label="Hard stop-loss limit (₹)"
              value={stopLossAmount}
              onChangeText={setStopLossAmount}
              keyboardType="number-pad"
              placeholder="50000"
            />
            <Text style={{ color: colors.inkMuted, fontFamily: fontFamily.medium, fontSize: 12, lineHeight: 18 }}>
              NUVO will alert you at 50/75/90% of budget, and flag every transaction once you cross this hard limit.
            </Text>
          </Animated.View>
        )}

        <View style={{ flex: 1 }} />
        <PrimaryButton
          label={step === totalSteps - 1 ? 'Continue' : 'Next'}
          loading={isLoading}
          onPress={onNext}
          style={{ marginTop: 32, marginBottom: 8 }}
        />
      </View>
    </Screen>
  );
}
