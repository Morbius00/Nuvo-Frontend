import { useEffect, useState } from 'react';
import { View, Text, TextInput } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Animated, {
  FadeInDown,
  FadeInUp,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { X, Mic } from 'lucide-react-native';
import { CalendarIcon } from '@/components/ui/icons/ImageIcon';
import { Screen } from '@/components/ui/Screen';
import { GlassCard } from '@/components/ui/GlassCard';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { Input } from '@/components/ui/Input';
import { Chip } from '@/components/ui/Chip';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { IconButton } from '@/components/ui/IconButton';
import { colors, fontFamily } from '@/theme/tokens';
import { formatDayYear, formatTime } from '@/utils/format';
import { useCreateTransactionMutation, useCreateVoiceTransactionMutation } from '@/store/api/transactionsApi';
import { TransactionsStackParamList } from '@/navigation/types';
import { PaymentMethod, TransactionType } from '@/types';
import { CategoryPickerGrid } from './CategoryPickerGrid';

type Nav = NativeStackNavigationProp<TransactionsStackParamList>;
type AddRoute = RouteProp<TransactionsStackParamList, 'AddTransaction'>;

const PAYMENT_METHODS: { key: PaymentMethod; label: string }[] = [
  { key: 'UPI', label: 'UPI' },
  { key: 'card', label: 'Card' },
  { key: 'cash', label: 'Cash' },
  { key: 'netbanking', label: 'Net Banking' },
];

export function AddTransactionScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<AddRoute>();

  const [type, setType] = useState<TransactionType>(route.params?.prefill?.type ?? 'expense');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState(type === 'income' ? 'income' : 'food_dining');
  const [merchant, setMerchant] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('UPI');
  const [voiceState, setVoiceState] = useState<'idle' | 'recording'>('idle');

  const [createTransaction, { isLoading: isCreating }] = useCreateTransactionMutation();
  const [createVoiceTransaction] = useCreateVoiceTransactionMutation();

  const pulse = useSharedValue(1);

  useEffect(() => {
    if (voiceState === 'recording') {
      pulse.value = withRepeat(withSequence(withTiming(1.2, { duration: 380 }), withTiming(1, { duration: 380 })), -1);
    } else {
      pulse.value = withTiming(1, { duration: 200 });
    }
  }, [voiceState, pulse]);

  const pulseStyle = useAnimatedStyle(() => ({ transform: [{ scale: pulse.value }] }));

  const onTypeChange = (v: string) => {
    const next: TransactionType = v === 'Income' ? 'income' : 'expense';
    setType(next);
    setCategory((prev) => {
      if (next === 'income') return 'income';
      return prev === 'income' ? 'food_dining' : prev;
    });
  };

  const handleVoiceCapture = async () => {
    if (voiceState === 'recording') return;
    setVoiceState('recording');
    const [result] = await Promise.all([
      createVoiceTransaction({ transcript: 'Spent 250 on food' })
        .unwrap()
        .catch(() => null),
      new Promise((resolve) => setTimeout(resolve, 1500)),
    ]);
    setVoiceState('idle');
    if (result) navigation.goBack();
  };

  const handleSave = async () => {
    const parsed = parseFloat(amount);
    if (!parsed || parsed <= 0) return;
    await createTransaction({
      type,
      amount: parsed,
      category,
      merchant: merchant.trim() || undefined,
      paymentMethod,
      transactionAt: new Date().toISOString(),
      tags: [],
    })
      .unwrap()
      .catch(() => undefined);
    navigation.goBack();
  };

  const now = new Date();
  const canSave = Boolean(parseFloat(amount) > 0);

  return (
    <Screen scroll>
      <View style={{ paddingHorizontal: 20, paddingTop: 4, gap: 20 }}>
        <Animated.View
          entering={FadeInDown.springify()}
          style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
        >
          <Text style={{ color: colors.ink, fontFamily: fontFamily.extrabold, fontSize: 20 }}>Add Transaction</Text>
          <IconButton
            variant="glass"
            size={40}
            icon={<X size={18} color={colors.ink} />}
            onPress={() => navigation.goBack()}
          />
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(60).springify()}>
          <SegmentedControl
            options={['Expense', 'Income']}
            value={type === 'income' ? 'Income' : 'Expense'}
            onChange={onTypeChange}
          />
        </Animated.View>

        <Animated.View
          entering={FadeInUp.delay(100).springify()}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}
        >
          <View style={{ flex: 1 }}>
            <GlassCard>
              <View style={{ paddingVertical: 22, alignItems: 'center', gap: 6 }}>
                <Text style={{ color: colors.inkMuted, fontFamily: fontFamily.semibold, fontSize: 12 }}>Amount</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <Text style={{ color: colors.ink, fontFamily: fontFamily.extrabold, fontSize: 32 }}>₹</Text>
                  <TextInput
                    value={amount}
                    onChangeText={(v) => setAmount(v.replace(/[^0-9.]/g, ''))}
                    keyboardType="decimal-pad"
                    placeholder="0"
                    placeholderTextColor={colors.inkMuted}
                    style={{
                      color: colors.ink,
                      fontFamily: fontFamily.extrabold,
                      fontSize: 40,
                      minWidth: 100,
                    }}
                  />
                </View>
              </View>
            </GlassCard>
          </View>
          <Animated.View style={pulseStyle}>
            <IconButton
              variant={voiceState === 'recording' ? 'solid' : 'glass'}
              size={52}
              icon={<Mic size={20} color={colors.ink} />}
              label={voiceState === 'recording' ? 'Listening…' : 'Voice'}
              onPress={handleVoiceCapture}
            />
          </Animated.View>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(140).springify()} style={{ gap: 10 }}>
          <Text style={{ color: colors.inkSecondary, fontFamily: fontFamily.semibold, fontSize: 13 }}>Category</Text>
          <CategoryPickerGrid value={category} onChange={setCategory} />
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(180).springify()}>
          <Input label="Merchant (optional)" placeholder="e.g. Swiggy" value={merchant} onChangeText={setMerchant} />
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(210).springify()} style={{ gap: 10 }}>
          <Text style={{ color: colors.inkSecondary, fontFamily: fontFamily.semibold, fontSize: 13 }}>
            Payment Method
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {PAYMENT_METHODS.map((m) => (
              <Chip
                key={m.key}
                label={m.label}
                selected={paymentMethod === m.key}
                onPress={() => setPaymentMethod(m.key)}
              />
            ))}
          </View>
        </Animated.View>

        <Animated.View
          entering={FadeInUp.delay(240).springify()}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}
        >
          <CalendarIcon size={22} color={colors.inkMuted} />
          <Text style={{ color: colors.inkSecondary, fontFamily: fontFamily.semibold, fontSize: 13.5 }}>
            Today, {formatTime(now)} · {formatDayYear(now)}
          </Text>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(280).springify()}>
          <PrimaryButton label="Save Transaction" onPress={handleSave} loading={isCreating} disabled={!canSave} />
        </Animated.View>
      </View>
    </Screen>
  );
}
