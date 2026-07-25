import { useEffect, useState } from 'react';
import { View, Text } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { X } from 'lucide-react-native';
import { Screen } from '@/components/ui/Screen';
import { GlassCard } from '@/components/ui/GlassCard';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { IconButton } from '@/components/ui/IconButton';
import { Input } from '@/components/ui/Input';
import { Chip } from '@/components/ui/Chip';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Skeleton } from '@/components/ui/Skeleton';
import { colors, fontFamily, tierForUtilisation } from '@/theme/tokens';
import { formatCurrency, formatPercent } from '@/utils/format';
import { RootStackParamList } from '@/navigation/types';
import { useGetCurrentBudgetQuery, useUpdateBudgetSettingsMutation, useUpdateStopLossMutation } from '@/store/api/budgetsApi';

type Nav = NativeStackNavigationProp<RootStackParamList, 'StopLossSettings'>;

const ALERT_PRESETS = [50, 75, 90];

export function StopLossSettingsScreen() {
  const navigation = useNavigation<Nav>();
  const { data: budget, isLoading } = useGetCurrentBudgetQuery();
  const [updateBudgetSettings, { isLoading: isSavingBudget }] = useUpdateBudgetSettingsMutation();
  const [updateStopLoss, { isLoading: isSavingStopLoss }] = useUpdateStopLossMutation();

  const [monthlyBudget, setMonthlyBudget] = useState('');
  const [stopLossLimit, setStopLossLimit] = useState('');
  const [alertAt, setAlertAt] = useState('75');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (budget) {
      setMonthlyBudget(String(budget.totalBudget));
      setStopLossLimit(String(budget.stopLoss.limit));
      setAlertAt(String(budget.stopLoss.alertAt));
    }
  }, [budget]);

  const utilisation = budget && budget.totalBudget > 0 ? (budget.totalSpent / budget.totalBudget) * 100 : 0;
  const tier = tierForUtilisation(utilisation);

  const onSave = async () => {
    await Promise.all([
      updateBudgetSettings({ monthlyBudget: Number(monthlyBudget) || 0 }).unwrap().catch(() => undefined),
      updateStopLoss({ limit: Number(stopLossLimit) || 0, alertAt: Number(alertAt) || 75 }).unwrap().catch(() => undefined),
    ]);
    setSaved(true);
    setTimeout(() => setSaved(false), 1800);
  };

  return (
    <Screen scroll>
      <View style={{ paddingHorizontal: 20, paddingTop: 4, gap: 22 }}>
        <Animated.View
          entering={FadeInDown.springify()}
          style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
        >
          <View>
            <Text style={{ color: colors.ink, fontFamily: fontFamily.extrabold, fontSize: 22 }}>Stop-Loss Settings</Text>
            <Text style={{ color: colors.inkMuted, fontFamily: fontFamily.medium, fontSize: 12.5, marginTop: 2 }}>
              Control how LUNA watches your budget
            </Text>
          </View>
          <IconButton variant="glass" size={40} icon={<X size={18} color={colors.ink} />} onPress={() => navigation.goBack()} />
        </Animated.View>

        {isLoading || !budget ? (
          <GlassCard>
            <View style={{ padding: 20, gap: 12 }}>
              <Skeleton height={14} />
              <Skeleton height={10} />
            </View>
          </GlassCard>
        ) : (
          <Animated.View entering={FadeInUp.delay(60).springify()}>
            <GlassCard>
              <View style={{ padding: 18, gap: 12 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={{ color: colors.inkSecondary, fontFamily: fontFamily.semibold, fontSize: 12.5 }}>
                    {formatCurrency(budget.totalSpent)} spent this month
                  </Text>
                  <Text style={{ color: tier.color, fontFamily: fontFamily.bold, fontSize: 12.5 }}>
                    {formatPercent(utilisation)} · {tier.label}
                  </Text>
                </View>
                <ProgressBar progress={utilisation} color={tier.color} />
              </View>
            </GlassCard>
          </Animated.View>
        )}

        <Animated.View entering={FadeInUp.delay(110).springify()} style={{ gap: 14 }}>
          <Input
            label="Monthly Budget (₹)"
            value={monthlyBudget}
            onChangeText={setMonthlyBudget}
            keyboardType="number-pad"
            placeholder="45000"
          />
          <Input
            label="Hard Stop-Loss Limit (₹)"
            value={stopLossLimit}
            onChangeText={setStopLossLimit}
            keyboardType="number-pad"
            placeholder="50000"
          />
          <Text style={{ color: colors.inkMuted, fontFamily: fontFamily.medium, fontSize: 12, lineHeight: 18 }}>
            NUVO flags every transaction once you cross this hard limit for the month.
          </Text>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(150).springify()} style={{ gap: 12 }}>
          <Text style={{ color: colors.inkSecondary, fontFamily: fontFamily.semibold, fontSize: 13 }}>
            Alert Threshold
          </Text>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {ALERT_PRESETS.map((p) => (
              <Chip key={p} label={`${p}%`} selected={alertAt === String(p)} onPress={() => setAlertAt(String(p))} />
            ))}
          </View>
          <Input
            value={alertAt}
            onChangeText={setAlertAt}
            keyboardType="number-pad"
            placeholder="75"
            rightIcon={<Text style={{ color: colors.inkMuted, fontFamily: fontFamily.semibold }}>%</Text>}
          />
          <Text style={{ color: colors.inkMuted, fontFamily: fontFamily.medium, fontSize: 12, lineHeight: 18 }}>
            LUNA sends a Watch alert at 50%, Caution at 75%, and Critical at 90% by default — this sets when your
            personal early-warning notification fires.
          </Text>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(200).springify()} style={{ marginTop: 4 }}>
          <PrimaryButton
            label={saved ? 'Saved' : 'Save Changes'}
            loading={isSavingBudget || isSavingStopLoss}
            onPress={onSave}
          />
        </Animated.View>
      </View>
    </Screen>
  );
}
