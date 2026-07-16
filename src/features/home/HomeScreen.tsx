import { useState } from 'react';
import { View, Text, Pressable, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useCrossNavigation } from '@/hooks/useCrossNavigation';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import {
  Bell,
  Settings as SettingsIcon,
  ArrowUpRight,
  ArrowDownLeft,
  Plus,
  ScanLine,
  QrCode,
  Sparkles,
  ChevronRight,
} from 'lucide-react-native';
import { Screen } from '@/components/ui/Screen';
import { GlassCard } from '@/components/ui/GlassCard';
import { IconButton } from '@/components/ui/IconButton';
import { AnimatedNumber } from '@/components/ui/AnimatedNumber';
import { Skeleton } from '@/components/ui/Skeleton';
import { BudgetGaugeCard } from '@/components/cards/BudgetGaugeCard';
import { StopLossTierBanner } from '@/components/cards/StopLossTierBanner';
import { TransactionRow } from '@/components/cards/TransactionRow';
import { colors, fontFamily, primaryGradient, tierForUtilisation, shadow } from '@/theme/tokens';
import { formatCurrency } from '@/utils/format';
import { HomeStackParamList } from '@/navigation/types';
import { useGetCurrentBudgetQuery } from '@/store/api/budgetsApi';
import { useListTransactionsQuery } from '@/store/api/transactionsApi';
import { useGetLunaInsightsQuery } from '@/store/api/aiApi';
import { useListNotificationsQuery } from '@/store/api/notificationsApi';
import { useAppSelector } from '@/store/hooks';

type Nav = NativeStackNavigationProp<HomeStackParamList>;

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

export function HomeScreen() {
  const navigation = useNavigation<Nav>();
  const crossNav = useCrossNavigation();
  const user = useAppSelector((s) => s.auth.user);
  const { data: budget, isLoading: budgetLoading } = useGetCurrentBudgetQuery();
  const { data: txnData, isLoading: txnLoading } = useListTransactionsQuery({ limit: 5 });
  const { data: insights } = useGetLunaInsightsQuery();
  const { data: notifications } = useListNotificationsQuery();

  const unreadCount = notifications?.filter((n) => !n.isRead).length ?? 0;
  const topInsight = insights?.find((i) => !i.isRead) ?? insights?.[0];
  const remaining = budget ? Math.max(0, budget.totalBudget - budget.totalSpent) : 0;
  const utilisation = budget && budget.totalBudget > 0 ? (budget.totalSpent / budget.totalBudget) * 100 : 0;
  const tier = tierForUtilisation(utilisation);
  const firstName = user?.name?.split(' ')[0] ?? 'there';
  const [balanceVisible, setBalanceVisible] = useState(false);

  return (
    <Screen scroll>
      <View style={{ paddingHorizontal: 20, paddingTop: 4, gap: 18 }}>
        <Animated.View entering={FadeInDown.springify()} style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View
            style={{
              width: 44,
              height: 44,
              borderRadius: 14,
              backgroundColor: colors.glassFillStrong,
              alignItems: 'center',
              justifyContent: 'center',
              borderWidth: 1,
              borderColor: colors.glassBorder,
            }}
          >
            <Image
              source={require('../../../assets/Profile-Image.png')}
              style={{ width: 44, height: 44, borderRadius: 14 }}
            />
          </View>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={{ color: colors.inkMuted, fontFamily: fontFamily.medium, fontSize: 12.5 }}>{greeting()},</Text>
            <Text style={{ color: colors.ink, fontFamily: fontFamily.extrabold, fontSize: 18 }}>{firstName}</Text>
          </View>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <View>
              <IconButton
                variant="glass"
                size={42}
                icon={<Bell size={18} color={colors.ink} />}
                onPress={() => crossNav.toRoot('Notifications')}
              />
              {unreadCount > 0 && (
                <View
                  style={{
                    position: 'absolute',
                    top: -2,
                    right: -2,
                    width: 16,
                    height: 16,
                    borderRadius: 8,
                    backgroundColor: colors.danger500,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Text style={{ color: colors.ink, fontSize: 9, fontFamily: fontFamily.bold }}>{unreadCount}</Text>
                </View>
              )}
            </View>
            <IconButton
              variant="glass"
              size={42}
              icon={<SettingsIcon size={18} color={colors.ink} />}
              onPress={() => crossNav.toRoot('Settings')}
            />
          </View>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(60).springify()}>
          <LinearGradient
            colors={primaryGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ borderRadius: 28, padding: 22, ...shadow.glow(colors.primary500), overflow: 'hidden' }}
          >
            {/* ── Decorative background shapes ─────────────────── */}
            {/* Large blurred circle — top-right */}
            <View pointerEvents="none" style={{ position: 'absolute', top: -48, right: -48, width: 180, height: 180, borderRadius: 90, backgroundColor: 'rgba(255,255,255,0.12)' }} />
            {/* Medium circle — bottom-left */}
            <View pointerEvents="none" style={{ position: 'absolute', bottom: -30, left: -30, width: 130, height: 130, borderRadius: 65, backgroundColor: 'rgba(255,255,255,0.09)' }} />
            {/* Small accent ring — centre-right */}
            <View pointerEvents="none" style={{ position: 'absolute', top: '38%', right: 28, width: 60, height: 60, borderRadius: 30, borderWidth: 2, borderColor: 'rgba(255,255,255,0.20)', backgroundColor: 'transparent' }} />
            {/* Tiny dot cluster */}
            <View pointerEvents="none" style={{ position: 'absolute', bottom: 28, right: 80, width: 10, height: 10, borderRadius: 5, backgroundColor: 'rgba(255,255,255,0.25)' }} />
            <View pointerEvents="none" style={{ position: 'absolute', bottom: 44, right: 96, width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.18)' }} />
            <View pointerEvents="none" style={{ position: 'absolute', bottom: 22, right: 100, width: 8, height: 8, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.15)' }} />
            {/* Diagonal slash line */}
            <View pointerEvents="none" style={{ position: 'absolute', top: 24, left: '55%', width: 80, height: 1.5, backgroundColor: 'rgba(255,255,255,0.15)', transform: [{ rotate: '-34deg' }] }} />
            <View pointerEvents="none" style={{ position: 'absolute', top: 36, left: '58%', width: 50, height: 1, backgroundColor: 'rgba(255,255,255,0.10)', transform: [{ rotate: '-34deg' }] }} />
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <Text style={{ color: 'rgba(0,0,0,0.55)', fontFamily: fontFamily.extrabold, fontSize: 17, marginTop: 10 }}>
                Available to spend
              </Text>
              <Image
                source={require('../../../assets/Nuvo-Logo.png')}
                style={{ width: 96, height: 42, resizeMode: 'contain', marginRight: -26 }}
              />
            </View>
            <Pressable onPress={() => setBalanceVisible((v) => !v)} hitSlop={10}>
              {balanceVisible ? (
                <AnimatedNumber
                  value={remaining}
                  formatter={(n) => formatCurrency(n)}
                  style={{ color: '#fff', fontFamily: fontFamily.extrabold, fontSize: 34, marginTop: 6 }}
                />
              ) : (
                <Text style={{ color: '#fff', fontFamily: fontFamily.extrabold, fontSize: 34, marginTop: 6, letterSpacing: 2 }}>
                  ₹ ******
                </Text>
              )}
            </Pressable>
            <View style={{ flexDirection: 'row', gap: 10, marginTop: 18 }}>
              <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(0,0,0,0.18)', borderRadius: 14, padding: 10 }}>
                <View style={{ width: 26, height: 26, borderRadius: 8, backgroundColor: 'rgba(0,0,0,0.20)', alignItems: 'center', justifyContent: 'center' }}>
                  <ArrowDownLeft size={14} color="#fff" />
                </View>
                <View>
                  <Text style={{ color: 'rgba(255,255,255,0.65)', fontFamily: fontFamily.semibold, fontSize: 10.5 }}>Income</Text>
                  <Text style={{ color: '#fff', fontFamily: fontFamily.bold, fontSize: 13.5 }}>
                    {budget ? formatCurrency(budget.totalIncome) : '—'}
                  </Text>
                </View>
              </View>
              <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(0,0,0,0.18)', borderRadius: 14, padding: 10 }}>
                <View style={{ width: 26, height: 26, borderRadius: 8, backgroundColor: 'rgba(0,0,0,0.20)', alignItems: 'center', justifyContent: 'center' }}>
                  <ArrowUpRight size={14} color="#fff" />
                </View>
                <View>
                  <Text style={{ color: 'rgba(255,255,255,0.65)', fontFamily: fontFamily.semibold, fontSize: 10.5 }}>Expenses</Text>
                  <Text style={{ color: '#fff', fontFamily: fontFamily.bold, fontSize: 13.5 }}>
                    {budget ? formatCurrency(budget.totalSpent) : '—'}
                  </Text>
                </View>
              </View>
            </View>
          </LinearGradient>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(120).springify()} style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <IconButton
            icon={<Plus size={22} color={colors.inkOnPrimary} />}
            label="Add"
            onPress={() => crossNav.toTab('TransactionsTab', 'AddTransaction')}
          />
          <IconButton
            icon={<ScanLine size={22} color={colors.inkOnPrimary} />}
            label="Scan"
            onPress={() => crossNav.toRoot('ScanReceipt')}
          />
          <IconButton
            icon={<QrCode size={22} color={colors.inkOnPrimary} />}
            label="UPI Import"
            onPress={() => crossNav.toTab('TransactionsTab', 'UpiImport')}
          />
          <Pressable
            onPress={() => crossNav.toTab('LunaTab', 'AdvisorChat')}
            style={{ alignItems: 'center', gap: 8 }}
          >
            <Image
              source={require('../../../assets/luna-profile-pic.png')}
              style={{ width: 56, height: 56, borderRadius: 28 }}
            />
            <Text style={{ color: colors.inkSecondary, fontFamily: fontFamily.medium, fontSize: 12 }}>Ask LUNA</Text>
          </Pressable>
        </Animated.View>

        {!budgetLoading && budget && (
          <Animated.View entering={FadeInUp.delay(160).springify()}>
            <StopLossTierBanner
              tier={tier}
              utilisation={utilisation}
              message={
                tier.key === 'yellow'
                  ? 'You’re halfway through your monthly budget.'
                  : tier.key === 'orange'
                    ? 'LUNA has 3 categories you can trim to stay on track.'
                    : tier.key === 'red'
                      ? 'You’re close to your limit — see LUNA’s recovery plan.'
                      : 'Your hard stop-loss limit has been reached.'
              }
              onPress={() => crossNav.toRoot('AlertDetail', { tier: tier.key })}
            />
          </Animated.View>
        )}

        <Animated.View entering={FadeInUp.delay(200).springify()}>
          <GlassCard onPress={() => navigation.navigate('SpendHealth')}>
            {budgetLoading || !budget ? (
              <View style={{ padding: 20 }}>
                <Skeleton height={110} />
              </View>
            ) : (
              <BudgetGaugeCard spent={budget.totalSpent} budget={budget.totalBudget} />
            )}
          </GlassCard>
        </Animated.View>

        {topInsight && (
          <Animated.View entering={FadeInUp.delay(240).springify()}>
            <GlassCard onPress={() => crossNav.toTab('LunaTab', 'Insights')}>
              <View style={{ flexDirection: 'row', gap: 12, padding: 16, alignItems: 'flex-start' }}>
                <View style={{ width: 36, height: 36, borderRadius: 11, backgroundColor: colors.primary500, alignItems: 'center', justifyContent: 'center' }}>
                  <Sparkles size={17} color={colors.inkOnPrimary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: colors.primary400, fontFamily: fontFamily.bold, fontSize: 11, marginBottom: 2 }}>
                    LUNA INSIGHT
                  </Text>
                  <Text style={{ color: colors.ink, fontFamily: fontFamily.bold, fontSize: 14 }} numberOfLines={2}>
                    {topInsight.title}
                  </Text>
                </View>
                <ChevronRight size={18} color={colors.inkMuted} />
              </View>
            </GlassCard>
          </Animated.View>
        )}

        <Animated.View entering={FadeInUp.delay(280).springify()}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <Text style={{ color: colors.ink, fontFamily: fontFamily.bold, fontSize: 17 }}>Recent Transactions</Text>
            <Pressable onPress={() => crossNav.toTab('TransactionsTab', 'TransactionList')}>
              <Text style={{ color: colors.primary400, fontFamily: fontFamily.semibold, fontSize: 13 }}>See all</Text>
            </Pressable>
          </View>
          <GlassCard>
            <View style={{ paddingHorizontal: 20, paddingVertical: 10 }}>
              {txnLoading || !txnData ? (
                <View style={{ paddingVertical: 16, gap: 14 }}>
                  {[0, 1, 2].map((i) => (
                    <Skeleton key={i} height={44} />
                  ))}
                </View>
              ) : (
                txnData.transactions.map((t, idx) => (
                  <View key={t._id} style={idx > 0 ? { borderTopWidth: 1, borderTopColor: colors.hairline } : undefined}>
                    <TransactionRow
                      transaction={t}
                      onPress={() =>
                        crossNav.toTab('TransactionsTab', 'TransactionDetail', { id: t._id })
                      }
                    />
                  </View>
                ))
              )}
            </View>
          </GlassCard>
        </Animated.View>
      </View>
    </Screen>
  );
}
