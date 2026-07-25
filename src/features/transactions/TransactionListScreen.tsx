import { useEffect, useMemo, useState } from 'react';
import { View, Text, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { Search, Plus } from 'lucide-react-native';
import { Screen } from '@/components/ui/Screen';
import { Input } from '@/components/ui/Input';
import { Chip } from '@/components/ui/Chip';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { IconButton } from '@/components/ui/IconButton';
import { GlassCard } from '@/components/ui/GlassCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import { TransactionRow } from '@/components/cards/TransactionRow';
import { colors, fontFamily } from '@/theme/tokens';
import { groupByDay } from '@/utils/format';
import { CATEGORIES } from '@/constants/categories';
import { useListTransactionsQuery } from '@/store/api/transactionsApi';
import { TransactionsStackParamList } from '@/navigation/types';

type Nav = NativeStackNavigationProp<TransactionsStackParamList>;

const TYPE_OPTIONS = ['All', 'Expense', 'Income'] as const;
type TypeOption = (typeof TYPE_OPTIONS)[number];

export function TransactionListScreen() {
  const navigation = useNavigation<Nav>();
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<string | undefined>(undefined);
  const [typeFilter, setTypeFilter] = useState<TypeOption>('All');

  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput.trim()), 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  const type = typeFilter === 'Expense' ? 'expense' : typeFilter === 'Income' ? 'income' : undefined;

  const { data, isLoading } = useListTransactionsQuery({
    category,
    type,
    search: search || undefined,
    limit: 50,
  });

  const sections = useMemo(() => {
    if (!data) return [];
    return groupByDay(data.items, (t) => t.transactionAt);
  }, [data]);

  const hasFilters = Boolean(category || type || search);

  return (
    <>
      <Screen scroll>
        <View style={{ paddingHorizontal: 20, paddingTop: 4, gap: 16 }}>
          <Animated.View entering={FadeInDown.springify()}>
            <Text style={{ color: colors.ink, fontFamily: fontFamily.extrabold, fontSize: 24 }}>Transactions</Text>
          </Animated.View>

          <Animated.View entering={FadeInUp.delay(60).springify()}>
            <Input
              placeholder="Search merchant or category"
              value={searchInput}
              onChangeText={setSearchInput}
              leftIcon={<Search size={18} color={colors.inkMuted} />}
              returnKeyType="search"
            />
          </Animated.View>

          <Animated.View entering={FadeInUp.delay(100).springify()}>
            <SegmentedControl options={[...TYPE_OPTIONS]} value={typeFilter} onChange={(v) => setTypeFilter(v as TypeOption)} />
          </Animated.View>

          <Animated.View entering={FadeInUp.delay(140).springify()}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 8, paddingRight: 20 }}
            >
              <Chip label="All" selected={!category} onPress={() => setCategory(undefined)} />
              {CATEGORIES.map((c) => (
                <Chip
                  key={c.key}
                  label={c.label}
                  selected={category === c.key}
                  color={c.color}
                  onPress={() => setCategory((prev) => (prev === c.key ? undefined : c.key))}
                />
              ))}
            </ScrollView>
          </Animated.View>

          {isLoading ? (
            <View style={{ gap: 14, marginTop: 4 }}>
              {[0, 1, 2, 3].map((i) => (
                <Skeleton key={i} height={64} />
              ))}
            </View>
          ) : sections.length === 0 ? (
            <Animated.View entering={FadeInUp.delay(180).springify()}>
              <EmptyState
                image={require('../../../assets/LUNA-Trnsaction.png')}
                title="No transactions found"
                subtitle={hasFilters ? 'Try adjusting your search or filters.' : 'Your transactions will show up here.'}
              />
            </Animated.View>
          ) : (
            <View style={{ gap: 24 }}>
              {sections.map((section, sIdx) => (
                <Animated.View key={section.title} entering={FadeInUp.delay(180 + sIdx * 40).springify()}>
                  <Text
                    style={{
                      color: colors.inkMuted,
                      fontFamily: fontFamily.bold,
                      fontSize: 12,
                      marginBottom: 10,
                      textTransform: 'uppercase',
                      letterSpacing: 0.5,
                    }}
                  >
                    {section.title}
                  </Text>
                  <GlassCard>
                    <View style={{ paddingHorizontal: 20, paddingVertical: 6 }}>
                      {section.data.map((t, idx) => (
                        <View key={t._id} style={idx > 0 ? { borderTopWidth: 1, borderTopColor: colors.hairline } : undefined}>
                          <TransactionRow
                            transaction={t}
                            onPress={() => navigation.navigate('TransactionDetail', { id: t._id })}
                          />
                        </View>
                      ))}
                    </View>
                  </GlassCard>
                </Animated.View>
              ))}
            </View>
          )}
        </View>
      </Screen>

      <Animated.View
        entering={FadeInUp.delay(220).springify()}
        style={{ position: 'absolute', bottom: 100, right: 20 }}
      >
        <IconButton
          size={58}
          icon={<Plus size={26} color={colors.inkOnPrimary} />}
          onPress={() => navigation.navigate('AddTransaction', undefined)}
        />
      </Animated.View>
    </>
  );
}
