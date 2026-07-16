import { View, Text } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { ArrowLeft, PiggyBank, Repeat, Sparkles } from 'lucide-react-native';
import { Screen } from '@/components/ui/Screen';
import { GlassCard } from '@/components/ui/GlassCard';
import { IconButton } from '@/components/ui/IconButton';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { AnimatedNumber } from '@/components/ui/AnimatedNumber';
import { colors, fontFamily, shadow } from '@/theme/tokens';
import { formatCurrency } from '@/utils/format';
import { LunaStackParamList } from '@/navigation/types';
import { useGetLunaOpportunitiesQuery } from '@/store/api/aiApi';
import { AiInsight } from '@/types';

type Nav = NativeStackNavigationProp<LunaStackParamList>;

function getHighlight(insight: AiInsight): { amount: number | null; label: string; caption?: string } {
  const meta = (insight.metadata ?? {}) as Record<string, unknown>;
  if (insight.type === 'subscription_audit') {
    const monthly = typeof meta.monthlyTotal === 'number' ? meta.monthlyTotal : null;
    const annual = typeof meta.annualTotal === 'number' ? meta.annualTotal : null;
    return {
      amount: monthly,
      label: monthly != null ? `${formatCurrency(monthly)}/mo` : '—',
      caption: annual != null ? `${formatCurrency(annual)}/year total spend` : undefined,
    };
  }
  const monthly = typeof meta.projectedMonthlySavings === 'number' ? meta.projectedMonthlySavings : null;
  return {
    amount: monthly,
    label: monthly != null ? `Save ${formatCurrency(monthly)}/mo` : '—',
  };
}

function OpportunityCard({ insight, index }: { insight: AiInsight; index: number }) {
  const isSubscription = insight.type === 'subscription_audit';
  const Icon = isSubscription ? Repeat : PiggyBank;
  const color = isSubscription ? colors.tierOrange : colors.primary500;
  const highlight = getHighlight(insight);

  return (
    <Animated.View entering={FadeInUp.delay(60 * index).springify()}>
      <GlassCard>
        <View style={{ padding: 16, gap: 10 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <View
              style={{
                width: 36,
                height: 36,
                borderRadius: 12,
                backgroundColor: `${color}22`,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Icon size={17} color={color} />
            </View>
            <Text style={{ flex: 1, color: colors.ink, fontFamily: fontFamily.bold, fontSize: 14 }} numberOfLines={2}>
              {insight.title}
            </Text>
          </View>
          <Text style={{ color: colors.primary400, fontFamily: fontFamily.extrabold, fontSize: 21 }}>{highlight.label}</Text>
          {highlight.caption && (
            <Text style={{ color: colors.inkMuted, fontFamily: fontFamily.medium, fontSize: 11.5, marginTop: -6 }}>
              {highlight.caption}
            </Text>
          )}
          <Text style={{ color: colors.inkSecondary, fontFamily: fontFamily.medium, fontSize: 13, lineHeight: 19 }}>
            {insight.body}
          </Text>
        </View>
      </GlassCard>
    </Animated.View>
  );
}

export function SavingsOpportunitiesScreen() {
  const navigation = useNavigation<Nav>();
  const { data: opportunities, isLoading } = useGetLunaOpportunitiesQuery();

  const total = (opportunities ?? []).reduce((sum, insight) => sum + (getHighlight(insight).amount ?? 0), 0);
  const countWithFigures = (opportunities ?? []).filter((i) => getHighlight(i).amount != null).length;

  return (
    <Screen scroll>
      <View style={{ paddingHorizontal: 20, paddingTop: 4, gap: 18 }}>
        <Animated.View entering={FadeInDown.springify()} style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <IconButton variant="glass" size={42} icon={<ArrowLeft size={19} color={colors.ink} />} onPress={() => navigation.goBack()} />
          <View style={{ flex: 1 }}>
            <Text style={{ color: colors.ink, fontFamily: fontFamily.extrabold, fontSize: 22 }}>Savings Opportunities</Text>
            <Text style={{ color: colors.inkMuted, fontFamily: fontFamily.medium, fontSize: 12.5 }}>Money LUNA found for you</Text>
          </View>
        </Animated.View>

        {!isLoading && countWithFigures > 0 && (
          <Animated.View entering={FadeInUp.delay(40).springify()}>
            <GlassCard glow={colors.primary500}>
              <View style={{ padding: 20 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
                  <View
                    style={{
                      width: 46,
                      height: 46,
                      borderRadius: 15,
                      backgroundColor: colors.primary500,
                      alignItems: 'center',
                      justifyContent: 'center',
                      ...shadow.glow(colors.primary500),
                    }}
                  >
                    <PiggyBank size={21} color={colors.inkOnPrimary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: colors.inkSecondary, fontFamily: fontFamily.semibold, fontSize: 12.5 }}>
                      LUNA found opportunities worth
                    </Text>
                    <AnimatedNumber
                      value={total}
                      formatter={(n) => `${formatCurrency(n)}/mo`}
                      style={{ color: colors.ink, fontFamily: fontFamily.extrabold, fontSize: 26, marginTop: 2 }}
                    />
                  </View>
                </View>
                <Text style={{ color: colors.inkMuted, fontFamily: fontFamily.medium, fontSize: 12, marginTop: 12, lineHeight: 17 }}>
                  Across {opportunities?.length ?? 0} opportunit{(opportunities?.length ?? 0) === 1 ? 'y' : 'ies'} — savings ideas
                  and subscriptions worth a second look.
                </Text>
              </View>
            </GlassCard>
          </Animated.View>
        )}

        {isLoading && (
          <View style={{ gap: 14 }}>
            {[0, 1, 2].map((i) => (
              <GlassCard key={i}>
                <View style={{ padding: 16 }}>
                  <Skeleton height={90} />
                </View>
              </GlassCard>
            ))}
          </View>
        )}

        {!isLoading && opportunities?.length === 0 && (
          <EmptyState
            icon={<Sparkles size={28} color={colors.primary400} />}
            title="No opportunities right now"
            subtitle="LUNA will surface savings ideas and subscription audits here as they turn up."
          />
        )}

        {!isLoading && opportunities && opportunities.length > 0 && (
          <View style={{ gap: 14 }}>
            {opportunities.map((insight, idx) => (
              <OpportunityCard key={insight._id} insight={insight} index={idx} />
            ))}
          </View>
        )}
      </View>
    </Screen>
  );
}
