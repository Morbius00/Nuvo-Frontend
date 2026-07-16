import { useState } from 'react';
import { View, Text } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import {
  ArrowLeft,
  ScrollText,
  PiggyBank,
  AlertTriangle,
  Target,
  Repeat,
  Receipt,
  TrendingUp,
  Sparkles,
} from 'lucide-react-native';
import { Screen } from '@/components/ui/Screen';
import { GlassCard } from '@/components/ui/GlassCard';
import { IconButton } from '@/components/ui/IconButton';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { colors, fontFamily } from '@/theme/tokens';
import { LunaStackParamList } from '@/navigation/types';
import { useGetLunaInsightsQuery } from '@/store/api/aiApi';
import { AiInsight, InsightType } from '@/types';

type Nav = NativeStackNavigationProp<LunaStackParamList>;

const TYPE_META: Record<InsightType, { icon: typeof ScrollText; color: string; label: string }> = {
  weekly_digest: { icon: ScrollText, color: colors.primary400, label: 'Weekly Digest' },
  savings_opportunity: { icon: PiggyBank, color: colors.primary500, label: 'Savings Opportunity' },
  anomaly_explanation: { icon: AlertTriangle, color: colors.tierRed, label: 'Anomaly' },
  goal_coaching: { icon: Target, color: colors.primary400, label: 'Goal Coaching' },
  subscription_audit: { icon: Repeat, color: colors.tierOrange, label: 'Subscription Audit' },
  tax_optimisation: { icon: Receipt, color: colors.lime500, label: 'Tax Optimisation' },
  predictive_warning: { icon: TrendingUp, color: colors.tierYellow, label: 'Prediction' },
};

function InsightCard({ insight, index }: { insight: AiInsight; index: number }) {
  const [expanded, setExpanded] = useState(false);
  const meta = TYPE_META[insight.type];
  const Icon = meta.icon;

  return (
    <Animated.View entering={FadeInUp.delay(60 * index).springify()}>
      <GlassCard
        onPress={() => setExpanded((e) => !e)}
        style={!insight.isRead ? { borderColor: 'rgba(34,227,122,0.45)' } : undefined}
      >
        <View style={{ flexDirection: 'row', gap: 12, padding: 16, alignItems: 'flex-start' }}>
          <View
            style={{
              width: 40,
              height: 40,
              borderRadius: 13,
              backgroundColor: `${meta.color}22`,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Icon size={19} color={meta.color} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ color: meta.color, fontFamily: fontFamily.bold, fontSize: 10.5, marginBottom: 3, letterSpacing: 0.3 }}>
              {meta.label.toUpperCase()}
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 8 }}>
              <Text style={{ flex: 1, color: colors.ink, fontFamily: fontFamily.bold, fontSize: 14.5, lineHeight: 19 }}>
                {insight.title}
              </Text>
              {!insight.isRead && (
                <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primary400, marginTop: 5 }} />
              )}
            </View>
            <Text
              style={{ color: colors.inkSecondary, fontFamily: fontFamily.medium, fontSize: 13, lineHeight: 19, marginTop: 6 }}
              numberOfLines={expanded ? undefined : 3}
            >
              {insight.body}
            </Text>
            <Text style={{ color: colors.inkMuted, fontFamily: fontFamily.semibold, fontSize: 11, marginTop: 8 }}>
              {Math.round(insight.confidence * 100)}% confidence
            </Text>
          </View>
        </View>
      </GlassCard>
    </Animated.View>
  );
}

export function InsightsScreen() {
  const navigation = useNavigation<Nav>();
  const { data: insights, isLoading } = useGetLunaInsightsQuery();

  return (
    <Screen scroll>
      <View style={{ paddingHorizontal: 20, paddingTop: 4, gap: 18 }}>
        <Animated.View entering={FadeInDown.springify()} style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <IconButton variant="glass" size={42} icon={<ArrowLeft size={19} color={colors.ink} />} onPress={() => navigation.goBack()} />
          <View style={{ flex: 1 }}>
            <Text style={{ color: colors.ink, fontFamily: fontFamily.extrabold, fontSize: 22 }}>Insights</Text>
            <Text style={{ color: colors.inkMuted, fontFamily: fontFamily.medium, fontSize: 12.5 }}>What LUNA has noticed</Text>
          </View>
        </Animated.View>

        {isLoading && (
          <View style={{ gap: 14 }}>
            {[0, 1, 2].map((i) => (
              <GlassCard key={i}>
                <View style={{ padding: 16 }}>
                  <Skeleton height={72} />
                </View>
              </GlassCard>
            ))}
          </View>
        )}

        {!isLoading && insights?.length === 0 && (
          <EmptyState
            icon={<Sparkles size={28} color={colors.primary400} />}
            title="No insights yet"
            subtitle="Keep using NUVO — LUNA will surface insights as your spending patterns take shape."
          />
        )}

        {!isLoading && insights && insights.length > 0 && (
          <View style={{ gap: 14 }}>
            {insights.map((insight, idx) => (
              <InsightCard key={insight._id} insight={insight} index={idx} />
            ))}
          </View>
        )}
      </View>
    </Screen>
  );
}
