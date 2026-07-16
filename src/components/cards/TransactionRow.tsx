import { View, Text, Pressable } from 'react-native';
import { AlertTriangle, Clock } from 'lucide-react-native';
import { MerchantIcon } from '@/components/ui/MerchantIcon';
import { colors, fontFamily } from '@/theme/tokens';
import { formatSignedCurrency, formatTime } from '@/utils/format';
import { getCategory } from '@/constants/categories';
import { Transaction } from '@/types';

interface TransactionRowProps {
  transaction: Transaction;
  onPress?: () => void;
}

export function TransactionRow({ transaction, onPress }: TransactionRowProps) {
  const category = getCategory(transaction.category);
  const title = transaction.merchant ?? category.label;
  const isPending = transaction.status === 'pending';

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        paddingVertical: 16,
        paddingHorizontal: 4,
        opacity: pressed ? 0.7 : 1,
      })}
    >
      {/* Top row: title + brand logo */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <View style={{ flex: 1, marginRight: 14 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text numberOfLines={1} style={{ color: colors.ink, fontFamily: fontFamily.semibold, fontSize: 14.5 }}>
              {title}
            </Text>
            {transaction.isAnomalous && <AlertTriangle size={13} color={colors.tierOrange} />}
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 }}>
            <Text style={{ color: colors.inkMuted, fontFamily: fontFamily.medium, fontSize: 12 }}>{category.label}</Text>
            <Text style={{ color: colors.inkMuted, fontFamily: fontFamily.medium, fontSize: 12 }}>·</Text>
            <Text style={{ color: colors.inkMuted, fontFamily: fontFamily.medium, fontSize: 12 }}>
              {formatTime(transaction.transactionAt)}
            </Text>
            {isPending && (
              <>
                <Clock size={11} color={colors.tierYellow} />
                <Text style={{ color: colors.tierYellow, fontFamily: fontFamily.semibold, fontSize: 11 }}>Pending</Text>
              </>
            )}
          </View>
        </View>
        <MerchantIcon merchant={transaction.merchant} category={transaction.category} size={36} style={{ marginTop: 4 }} />
      </View>

      {/* Amount row */}
      <Text
        style={{
          color: transaction.type === 'income' ? colors.primary400 : colors.ink,
          fontFamily: fontFamily.bold,
          fontSize: 14.5,
          marginTop: 8,
        }}
      >
        {formatSignedCurrency(transaction.amount, transaction.type)}
      </Text>
    </Pressable>
  );
}
