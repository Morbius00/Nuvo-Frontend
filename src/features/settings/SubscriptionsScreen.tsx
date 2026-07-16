import { useState } from 'react';
import { View, Text } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { X, Repeat, Sparkles, ChevronDown, ChevronUp } from 'lucide-react-native';
import { Screen } from '@/components/ui/Screen';
import { GlassCard } from '@/components/ui/GlassCard';
import { IconButton } from '@/components/ui/IconButton';
import { Badge } from '@/components/ui/Chip';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { MerchantIcon } from '@/components/ui/MerchantIcon';
import { colors, fontFamily } from '@/theme/tokens';
import { formatCurrency, formatDayYear } from '@/utils/format';
import { RootStackParamList } from '@/navigation/types';
import { useGetSubscriptionAuditQuery } from '@/store/api/aiApi';
import { SubscriptionFrequency } from '@/types';

type Nav = NativeStackNavigationProp<RootStackParamList, 'Subscriptions'>;

const FREQUENCY_LABEL: Record<SubscriptionFrequency, string> = {
  weekly: 'Weekly',
  monthly: 'Monthly',
  quarterly: 'Quarterly',
  yearly: 'Yearly',
};

export function SubscriptionsScreen() {
  const navigation = useNavigation<Nav>();
  const { data, isLoading } = useGetSubscriptionAuditQuery();
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const toggle = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <Screen scroll>
      <View style={{ paddingHorizontal: 20, paddingTop: 4, gap: 20 }}>
        <Animated.View
          entering={FadeInDown.springify()}
          style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
        >
          <View>
            <Text style={{ color: colors.ink, fontFamily: fontFamily.extrabold, fontSize: 22 }}>Subscriptions</Text>
            <Text style={{ color: colors.inkMuted, fontFamily: fontFamily.medium, fontSize: 12.5, marginTop: 2 }}>
              Recurring charges LUNA is tracking
            </Text>
          </View>
          <IconButton variant="glass" size={40} icon={<X size={18} color={colors.ink} />} onPress={() => navigation.goBack()} />
        </Animated.View>

        {isLoading || !data ? (
          <GlassCard>
            <View style={{ padding: 20, gap: 12 }}>
              <Skeleton height={50} />
              <Skeleton height={50} />
            </View>
          </GlassCard>
        ) : (
          <>
            <Animated.View entering={FadeInUp.delay(60).springify()}>
              <GlassCard>
                <View style={{ flexDirection: 'row', padding: 18 }}>
                  <View style={{ flex: 1, gap: 4 }}>
                    <Text style={{ color: colors.inkMuted, fontFamily: fontFamily.semibold, fontSize: 11.5 }}>MONTHLY</Text>
                    <Text style={{ color: colors.ink, fontFamily: fontFamily.extrabold, fontSize: 22 }}>
                      {formatCurrency(data.monthlyTotal)}
                    </Text>
                  </View>
                  <View style={{ width: 1, backgroundColor: colors.hairline, marginHorizontal: 14 }} />
                  <View style={{ flex: 1, gap: 4 }}>
                    <Text style={{ color: colors.inkMuted, fontFamily: fontFamily.semibold, fontSize: 11.5 }}>ANNUAL</Text>
                    <Text style={{ color: colors.ink, fontFamily: fontFamily.extrabold, fontSize: 22 }}>
                      {formatCurrency(data.annualTotal)}
                    </Text>
                  </View>
                </View>
              </GlassCard>
            </Animated.View>

            {data.subscriptions.length === 0 ? (
              <EmptyState
                icon={<Repeat size={30} color={colors.inkMuted} />}
                title="No subscriptions found"
                subtitle="LUNA hasn't detected any recurring charges yet."
              />
            ) : (
              <View style={{ gap: 10 }}>
                {data.subscriptions.map((sub, idx) => {
                  const isOpen = expanded.has(sub._id);
                  return (
                    <Animated.View key={sub._id} entering={FadeInUp.delay(100 + idx * 40).springify()}>
                      <GlassCard onPress={() => toggle(sub._id)}>
                        <View style={{ padding: 16, gap: 10 }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                            <MerchantIcon merchant={sub.name} category="other" size={40} style={{ borderRadius: 12 }} />
                            <View style={{ flex: 1 }}>
                              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                <Text style={{ color: colors.ink, fontFamily: fontFamily.bold, fontSize: 14.5 }} numberOfLines={1}>
                                  {sub.name}
                                </Text>
                                {sub.isAiDetected && <Badge label="AI Detected" color={colors.primary500} subtle />}
                              </View>
                              <Text style={{ color: colors.inkMuted, fontFamily: fontFamily.medium, fontSize: 12, marginTop: 2 }}>
                                {FREQUENCY_LABEL[sub.frequency]}
                                {sub.nextDueDate ? ` · Next: ${formatDayYear(sub.nextDueDate)}` : ''}
                              </Text>
                            </View>
                            <View style={{ alignItems: 'flex-end' }}>
                              <Text style={{ color: colors.ink, fontFamily: fontFamily.bold, fontSize: 15 }}>
                                {formatCurrency(sub.amount)}
                              </Text>
                            </View>
                            {isOpen ? (
                              <ChevronUp size={16} color={colors.inkMuted} />
                            ) : (
                              <ChevronDown size={16} color={colors.inkMuted} />
                            )}
                          </View>

                          {isOpen && (
                            <View
                              style={{
                                borderTopWidth: 1,
                                borderTopColor: colors.hairline,
                                paddingTop: 10,
                                flexDirection: 'row',
                                gap: 10,
                              }}
                            >
                              <Sparkles size={15} color={colors.primary400} style={{ marginTop: 1 }} />
                              <Text style={{ color: colors.inkSecondary, fontFamily: fontFamily.medium, fontSize: 12.5, lineHeight: 18, flex: 1 }}>
                                To cancel, open the {sub.name} app or website, go to Account → Subscriptions, and end
                                the plan before your next billing date
                                {sub.nextDueDate ? ` (${formatDayYear(sub.nextDueDate)})` : ''}. LUNA will remind you 3
                                days ahead of every renewal.
                              </Text>
                            </View>
                          )}
                        </View>
                      </GlassCard>
                    </Animated.View>
                  );
                })}
              </View>
            )}
          </>
        )}
      </View>
    </Screen>
  );
}
