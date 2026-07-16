import { useEffect, useRef, useState } from 'react';
import { View, Text, Alert } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { BottomSheetModal } from '@gorhom/bottom-sheet';
import {
  ArrowLeft,
  Trash2,
  ChevronRight,
  TriangleAlert,
  CreditCard,
  Calendar,
  Tag,
  Plus,
  X,
  Receipt as ReceiptIcon,
} from 'lucide-react-native';
import { Screen } from '@/components/ui/Screen';
import { GlassCard } from '@/components/ui/GlassCard';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { GlassButton } from '@/components/ui/GlassButton';
import { IconButton } from '@/components/ui/IconButton';
import { Chip, Badge } from '@/components/ui/Chip';
import { MerchantIcon } from '@/components/ui/MerchantIcon';
import { Input } from '@/components/ui/Input';
import { GlassBottomSheet } from '@/components/ui/GlassBottomSheet';
import { Skeleton } from '@/components/ui/Skeleton';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { colors, fontFamily } from '@/theme/tokens';
import { formatSignedCurrency, formatCurrency, formatDayYear, formatTime, formatPercent } from '@/utils/format';
import { getCategory } from '@/constants/categories';
import {
  useGetTransactionQuery,
  useUpdateTransactionMutation,
  useDeleteTransactionMutation,
} from '@/store/api/transactionsApi';
import { TransactionsStackParamList } from '@/navigation/types';
import { CategoryPickerGrid } from './CategoryPickerGrid';

type Nav = NativeStackNavigationProp<TransactionsStackParamList>;
type DetailRoute = RouteProp<TransactionsStackParamList, 'TransactionDetail'>;

const PAYMENT_LABELS: Record<string, string> = {
  UPI: 'UPI',
  card: 'Card',
  cash: 'Cash',
  netbanking: 'Net Banking',
};

const STATUS_COLORS: Record<string, string> = {
  pending: colors.tierYellow,
  confirmed: colors.primary500,
  rejected: colors.danger500,
};

export function TransactionDetailScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<DetailRoute>();
  const { id } = route.params;

  const { data: transaction, isLoading } = useGetTransactionQuery(id);
  const [updateTransaction, { isLoading: isSaving }] = useUpdateTransactionMutation();
  const [deleteTransaction, { isLoading: isDeleting }] = useDeleteTransactionMutation();

  const sheetRef = useRef<BottomSheetModal>(null);

  const [hydrated, setHydrated] = useState(false);
  const [category, setCategory] = useState('other');
  const [notes, setNotes] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');

  useEffect(() => {
    if (transaction && !hydrated) {
      setCategory(transaction.category);
      setNotes(transaction.notes ?? '');
      setTags(transaction.tags ?? []);
      setHydrated(true);
    }
  }, [transaction, hydrated]);

  const addTag = () => {
    const t = tagInput.trim();
    if (t && !tags.includes(t)) setTags((prev) => [...prev, t]);
    setTagInput('');
  };

  const removeTag = (t: string) => setTags((prev) => prev.filter((x) => x !== t));

  const handleSave = () => {
    updateTransaction({ id, patch: { category, notes: notes || undefined, tags } })
      .unwrap()
      .catch(() => undefined);
  };

  const handleConfirm = () => {
    updateTransaction({ id, patch: { status: 'confirmed' } })
      .unwrap()
      .catch(() => undefined);
  };

  const handleReject = async () => {
    await updateTransaction({ id, patch: { status: 'rejected' } })
      .unwrap()
      .catch(() => undefined);
    navigation.goBack();
  };

  const handleDelete = () => {
    Alert.alert('Delete transaction?', 'This action cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await deleteTransaction(id).unwrap().catch(() => undefined);
          navigation.goBack();
        },
      },
    ]);
  };

  if (isLoading || !transaction) {
    return (
      <Screen scroll>
        <View style={{ paddingHorizontal: 20, paddingTop: 4, gap: 16 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <IconButton
              variant="glass"
              size={42}
              icon={<ArrowLeft size={19} color={colors.ink} />}
              onPress={() => navigation.goBack()}
            />
          </View>
          <Skeleton height={90} radius={24} />
          <Skeleton height={140} radius={24} />
          <Skeleton height={100} radius={24} />
        </View>
      </Screen>
    );
  }

  const catDef = getCategory(category);
  const isIncome = transaction.type === 'income';
  const statusColor = STATUS_COLORS[transaction.status] ?? colors.inkMuted;

  return (
    <>
      <Screen scroll>
        <View style={{ paddingHorizontal: 20, paddingTop: 4, gap: 18 }}>
          <Animated.View
            entering={FadeInDown.springify()}
            style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
          >
            <IconButton
              variant="glass"
              size={42}
              icon={<ArrowLeft size={19} color={colors.ink} />}
              onPress={() => navigation.goBack()}
            />
            <IconButton
              variant="glass"
              size={42}
              icon={<Trash2 size={18} color={colors.danger400} />}
              onPress={handleDelete}
            />
          </Animated.View>

          <Animated.View entering={FadeInUp.delay(60).springify()} style={{ alignItems: 'center', gap: 10 }}>
            <MerchantIcon category={category} size={72} />
            <Text style={{ color: colors.ink, fontFamily: fontFamily.extrabold, fontSize: 20, textAlign: 'center' }}>
              {transaction.merchant ?? catDef.label}
            </Text>
            <Text style={{ color: colors.inkMuted, fontFamily: fontFamily.medium, fontSize: 13 }}>{catDef.label}</Text>
            <Badge label={transaction.status.toUpperCase()} color={statusColor} subtle />
          </Animated.View>

          <Animated.View entering={FadeInUp.delay(100).springify()} style={{ alignItems: 'center' }}>
            <Text
              style={{
                color: isIncome ? colors.primary400 : colors.ink,
                fontFamily: fontFamily.extrabold,
                fontSize: 38,
              }}
            >
              {formatSignedCurrency(transaction.amount, transaction.type)}
            </Text>
          </Animated.View>

          <Animated.View entering={FadeInUp.delay(140).springify()}>
            <GlassCard>
              <View style={{ padding: 16, gap: 12 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <Calendar size={16} color={colors.inkMuted} />
                  <Text style={{ color: colors.inkSecondary, fontFamily: fontFamily.semibold, fontSize: 13.5 }}>
                    {formatDayYear(transaction.transactionAt)} · {formatTime(transaction.transactionAt)}
                  </Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <CreditCard size={16} color={colors.inkMuted} />
                  <Text style={{ color: colors.inkSecondary, fontFamily: fontFamily.semibold, fontSize: 13.5 }}>
                    {transaction.paymentMethod ? PAYMENT_LABELS[transaction.paymentMethod] : 'Not specified'}
                    {transaction.upiRefId ? ` · ${transaction.upiRefId}` : ''}
                  </Text>
                </View>
              </View>
            </GlassCard>
          </Animated.View>

          {transaction.isAnomalous && (
            <Animated.View entering={FadeInUp.delay(180).springify()}>
              <GlassCard style={{ borderColor: 'rgba(255,145,66,0.4)' }}>
                <View style={{ flexDirection: 'row', gap: 12, padding: 16, alignItems: 'flex-start' }}>
                  <View
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 11,
                      backgroundColor: 'rgba(255,145,66,0.16)',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <TriangleAlert size={18} color={colors.tierOrange} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: colors.tierOrange, fontFamily: fontFamily.bold, fontSize: 13.5 }}>
                      Flagged by anomaly detection
                    </Text>
                    <Text
                      style={{
                        color: colors.inkSecondary,
                        fontFamily: fontFamily.medium,
                        fontSize: 12.5,
                        marginTop: 4,
                        lineHeight: 18,
                      }}
                    >
                      {transaction.notes ??
                        `NUVO's Isolation Forest model flagged this as unusual for ${catDef.label} — it deviates from your typical spend in this category.`}
                    </Text>
                  </View>
                </View>
              </GlassCard>
            </Animated.View>
          )}

          {transaction.status === 'pending' && (
            <Animated.View entering={FadeInUp.delay(210).springify()} style={{ flexDirection: 'row', gap: 12 }}>
              <View style={{ flex: 1 }}>
                <GlassButton label="Reject" variant="danger" onPress={handleReject} />
              </View>
              <View style={{ flex: 1.4 }}>
                <PrimaryButton label="Confirm" onPress={handleConfirm} loading={isSaving} />
              </View>
            </Animated.View>
          )}

          {transaction.ocrData && (
            <Animated.View entering={FadeInUp.delay(240).springify()}>
              <GlassCard>
                <View style={{ padding: 16, gap: 12 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <ReceiptIcon size={16} color={colors.primary400} />
                    <Text style={{ color: colors.ink, fontFamily: fontFamily.bold, fontSize: 14.5 }}>Receipt Details</Text>
                  </View>

                  <View style={{ flexDirection: 'row', paddingBottom: 6, borderBottomWidth: 1, borderBottomColor: colors.hairline }}>
                    <Text style={{ flex: 2, color: colors.inkMuted, fontFamily: fontFamily.semibold, fontSize: 11 }}>ITEM</Text>
                    <Text style={{ flex: 0.6, color: colors.inkMuted, fontFamily: fontFamily.semibold, fontSize: 11, textAlign: 'center' }}>
                      QTY
                    </Text>
                    <Text style={{ flex: 1, color: colors.inkMuted, fontFamily: fontFamily.semibold, fontSize: 11, textAlign: 'right' }}>
                      TOTAL
                    </Text>
                  </View>

                  {transaction.ocrData.items.map((item, idx) => (
                    <View key={`${item.name}-${idx}`} style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Text style={{ flex: 2, color: colors.ink, fontFamily: fontFamily.medium, fontSize: 13 }} numberOfLines={1}>
                        {item.name}
                      </Text>
                      <Text style={{ flex: 0.6, color: colors.inkSecondary, fontFamily: fontFamily.medium, fontSize: 13, textAlign: 'center' }}>
                        {item.qty ?? 1}
                      </Text>
                      <Text style={{ flex: 1, color: colors.ink, fontFamily: fontFamily.semibold, fontSize: 13, textAlign: 'right' }}>
                        {item.totalPrice !== undefined ? formatCurrency(item.totalPrice) : '—'}
                      </Text>
                    </View>
                  ))}

                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingTop: 8, borderTopWidth: 1, borderTopColor: colors.hairline }}>
                    <Text style={{ color: colors.inkMuted, fontFamily: fontFamily.semibold, fontSize: 12.5 }}>Tax</Text>
                    <Text style={{ color: colors.inkSecondary, fontFamily: fontFamily.bold, fontSize: 12.5 }}>
                      {formatCurrency(transaction.ocrData.taxAmount)}
                    </Text>
                  </View>

                  {transaction.ocrData.confidence !== undefined && (
                    <View style={{ gap: 6, marginTop: 4 }}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                        <Text style={{ color: colors.inkMuted, fontFamily: fontFamily.medium, fontSize: 11.5 }}>OCR confidence</Text>
                        <Text style={{ color: colors.primary400, fontFamily: fontFamily.bold, fontSize: 11.5 }}>
                          {formatPercent(transaction.ocrData.confidence * 100, 0)}
                        </Text>
                      </View>
                      <ProgressBar progress={transaction.ocrData.confidence * 100} color={colors.primary400} height={6} />
                    </View>
                  )}
                </View>
              </GlassCard>
            </Animated.View>
          )}

          <Animated.View entering={FadeInUp.delay(270).springify()}>
            <GlassCard onPress={() => sheetRef.current?.present()}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16 }}>
                <MerchantIcon category={category} size={40} />
                <View style={{ flex: 1 }}>
                  <Text style={{ color: colors.inkMuted, fontFamily: fontFamily.medium, fontSize: 11 }}>Category</Text>
                  <Text style={{ color: colors.ink, fontFamily: fontFamily.bold, fontSize: 15 }}>{catDef.label}</Text>
                </View>
                <ChevronRight size={18} color={colors.inkMuted} />
              </View>
            </GlassCard>
          </Animated.View>

          <Animated.View entering={FadeInUp.delay(300).springify()}>
            <Input label="Notes" placeholder="Add a note…" value={notes} onChangeText={setNotes} />
          </Animated.View>

          <Animated.View entering={FadeInUp.delay(330).springify()} style={{ gap: 10 }}>
            <Text style={{ color: colors.inkSecondary, fontFamily: fontFamily.semibold, fontSize: 13 }}>Tags</Text>
            {tags.length > 0 && (
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {tags.map((t) => (
                  <Chip key={t} label={t} selected icon={<X size={12} color={colors.inkOnPrimary} />} onPress={() => removeTag(t)} />
                ))}
              </View>
            )}
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <View style={{ flex: 1 }}>
                <Input
                  placeholder="Add a tag"
                  value={tagInput}
                  onChangeText={setTagInput}
                  onSubmitEditing={addTag}
                  returnKeyType="done"
                  leftIcon={<Tag size={16} color={colors.inkMuted} />}
                />
              </View>
              <IconButton variant="glass" size={54} icon={<Plus size={20} color={colors.ink} />} onPress={addTag} />
            </View>
          </Animated.View>

          <Animated.View entering={FadeInUp.delay(360).springify()}>
            <PrimaryButton label="Save Changes" onPress={handleSave} loading={isSaving || isDeleting} />
          </Animated.View>
        </View>
      </Screen>

      <GlassBottomSheet ref={sheetRef}>
        <View style={{ gap: 16, paddingTop: 8 }}>
          <Text style={{ color: colors.ink, fontFamily: fontFamily.bold, fontSize: 17 }}>Choose category</Text>
          <CategoryPickerGrid
            value={category}
            onChange={(key) => {
              setCategory(key);
              sheetRef.current?.dismiss();
            }}
          />
        </View>
      </GlassBottomSheet>
    </>
  );
}
