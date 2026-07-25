import { useEffect, useState } from 'react';
import { View, Text } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { X, Check, ScanLine } from 'lucide-react-native';
import { Screen } from '@/components/ui/Screen';
import { GlassCard } from '@/components/ui/GlassCard';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { GlassButton } from '@/components/ui/GlassButton';
import { IconButton } from '@/components/ui/IconButton';
import { Chip, Badge } from '@/components/ui/Chip';
import { Input } from '@/components/ui/Input';
import { MerchantIcon } from '@/components/ui/MerchantIcon';
import { Skeleton } from '@/components/ui/Skeleton';
import { colors, fontFamily } from '@/theme/tokens';
import { formatCurrency, formatDayYear } from '@/utils/format';
import { CATEGORIES } from '@/constants/categories';
import { RootStackParamList } from '@/navigation/types';
import {
  useGetTransactionQuery,
  useUpdateTransactionMutation,
  useGetScanJobStatusQuery,
} from '@/store/api/transactionsApi';

type Nav = NativeStackNavigationProp<RootStackParamList, 'TransactionConfirm'>;
type Rt = RouteProp<RootStackParamList, 'TransactionConfirm'>;

export function TransactionConfirmScreen() {
  const navigation = useNavigation<Nav>();
  const { params } = useRoute<Rt>();
  const [jobDone, setJobDone] = useState(!params.jobId);

  const { data: jobStatus } = useGetScanJobStatusQuery(params.jobId ?? '', {
    skip: !params.jobId || jobDone,
    pollingInterval: 1500,
  });
  const { data: transaction, isLoading, refetch } = useGetTransactionQuery(params.transactionId);
  const [confirmTransaction, { isLoading: isConfirming }] = useUpdateTransactionMutation();
  const [discardTransaction, { isLoading: isDiscarding }] = useUpdateTransactionMutation();

  useEffect(() => {
    if (jobStatus && (jobStatus.state === 'completed' || jobStatus.state === 'failed')) {
      setJobDone(true);
      refetch();
    }
  }, [jobStatus, refetch]);

  const [merchant, setMerchant] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('other');

  useEffect(() => {
    if (transaction) {
      setMerchant(transaction.merchant ?? '');
      setAmount(String(transaction.amount));
      setCategory(transaction.category);
    }
  }, [transaction]);

  const onConfirm = async () => {
    await confirmTransaction({
      id: params.transactionId,
      patch: { merchant, amount: Number(amount) || 0, category, status: 'confirmed' },
    })
      .unwrap()
      .catch(() => undefined);
    navigation.goBack();
  };

  const onDiscard = async () => {
    await discardTransaction({ id: params.transactionId, patch: { status: 'rejected' } })
      .unwrap()
      .catch(() => undefined);
    navigation.goBack();
  };

  return (
    <Screen scroll>
      <View style={{ paddingHorizontal: 20, paddingTop: 4, gap: 18 }}>
        <Animated.View
          entering={FadeInDown.springify()}
          style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
        >
          <View style={{ flex: 1 }}>
            <Text style={{ color: colors.ink, fontFamily: fontFamily.extrabold, fontSize: 20 }}>Confirm Transaction</Text>
            <Text style={{ color: colors.inkMuted, fontFamily: fontFamily.medium, fontSize: 12.5, marginTop: 2 }}>
              Review what LUNA scanned before it hits your ledger
            </Text>
          </View>
          <IconButton variant="glass" size={40} icon={<X size={18} color={colors.ink} />} onPress={() => navigation.goBack()} />
        </Animated.View>

        {!jobDone ? (
          <GlassCard>
            <View style={{ padding: 32, alignItems: 'center', gap: 12 }}>
              <ScanLine size={32} color={colors.primary400} />
              <Text style={{ color: colors.ink, fontFamily: fontFamily.bold, fontSize: 15 }}>Processing your receipt…</Text>
              <Text style={{ color: colors.inkMuted, fontFamily: fontFamily.medium, fontSize: 12.5, textAlign: 'center' }}>
                LUNA is reading the amount, merchant and category — this usually takes a few seconds.
              </Text>
            </View>
          </GlassCard>
        ) : isLoading || !transaction ? (
          <GlassCard>
            <View style={{ padding: 20, gap: 12 }}>
              <Skeleton height={80} />
              <Skeleton height={44} />
              <Skeleton height={44} />
            </View>
          </GlassCard>
        ) : (
          <>
            <Animated.View entering={FadeInUp.delay(60).springify()}>
              <GlassCard>
                <View style={{ padding: 18, gap: 14 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                    <MerchantIcon category={category} size={48} />
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: colors.ink, fontFamily: fontFamily.bold, fontSize: 16 }} numberOfLines={1}>
                        {merchant || 'Unknown merchant'}
                      </Text>
                      <Text style={{ color: colors.inkMuted, fontFamily: fontFamily.medium, fontSize: 12 }}>
                        {formatDayYear(transaction.transactionAt)}
                      </Text>
                    </View>
                    {typeof transaction.ocrData?.confidence === 'number' && (
                      <Badge
                        label={`${Math.round(transaction.ocrData.confidence * 100)}% match`}
                        color={transaction.ocrData.confidence > 0.85 ? colors.primary500 : colors.tierYellow}
                        subtle
                      />
                    )}
                  </View>
                  <Text style={{ color: colors.ink, fontFamily: fontFamily.extrabold, fontSize: 30 }}>
                    {formatCurrency(Number(amount) || 0)}
                  </Text>
                </View>
              </GlassCard>
            </Animated.View>

            <Animated.View entering={FadeInUp.delay(110).springify()} style={{ gap: 10 }}>
              <Input label="Merchant" value={merchant} onChangeText={setMerchant} placeholder="Merchant name" />
              <Input label="Amount (₹)" value={amount} onChangeText={setAmount} keyboardType="decimal-pad" placeholder="0" />
            </Animated.View>

            <Animated.View entering={FadeInUp.delay(150).springify()} style={{ gap: 10 }}>
              <Text style={{ color: colors.inkSecondary, fontFamily: fontFamily.semibold, fontSize: 13 }}>Category</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {CATEGORIES.filter((c) => c.key !== 'transfer').map((c) => (
                  <Chip
                    key={c.key}
                    label={c.label}
                    selected={category === c.key}
                    color={c.color}
                    onPress={() => setCategory(c.key)}
                  />
                ))}
              </View>
            </Animated.View>

            {transaction.ocrData?.items && transaction.ocrData.items.length > 0 && (
              <Animated.View entering={FadeInUp.delay(190).springify()}>
                <GlassCard>
                  <View style={{ padding: 16, gap: 10 }}>
                    <Text style={{ color: colors.inkSecondary, fontFamily: fontFamily.semibold, fontSize: 12 }}>
                      ITEMS PARSED FROM RECEIPT
                    </Text>
                    {transaction.ocrData.items.map((item, idx) => (
                      <View key={idx} style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12 }}>
                        <Text
                          style={{ color: colors.ink, fontFamily: fontFamily.medium, fontSize: 13.5, flex: 1 }}
                          numberOfLines={1}
                        >
                          {item.qty && item.qty > 1 ? `${item.qty}x ` : ''}
                          {item.name}
                        </Text>
                        {typeof item.totalPrice === 'number' && (
                          <Text style={{ color: colors.inkSecondary, fontFamily: fontFamily.semibold, fontSize: 13.5 }}>
                            {formatCurrency(item.totalPrice)}
                          </Text>
                        )}
                      </View>
                    ))}
                  </View>
                </GlassCard>
              </Animated.View>
            )}

            <Animated.View entering={FadeInUp.delay(230).springify()} style={{ gap: 12, marginTop: 4 }}>
              <PrimaryButton
                label="Confirm"
                icon={<Check size={18} color={colors.inkOnPrimary} />}
                loading={isConfirming}
                disabled={isDiscarding}
                onPress={onConfirm}
              />
              <GlassButton label="Discard" variant="danger" onPress={onDiscard} />
            </Animated.View>
          </>
        )}
      </View>
    </Screen>
  );
}
