import { ReactNode, useState } from 'react';
import { View, Text, ScrollView, NativeSyntheticEvent, NativeScrollEvent, useWindowDimensions } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { ArrowLeft, Sparkles, PiggyBank, PartyPopper } from 'lucide-react-native';
import { TrophyIcon, type IconComponent } from '@/components/ui/icons/ImageIcon';
import { Screen } from '@/components/ui/Screen';
import { IconButton } from '@/components/ui/IconButton';
import { LiquidGlassSurface } from '@/components/ui/LiquidGlassSurface';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { Skeleton } from '@/components/ui/Skeleton';
import { RadialGauge } from '@/components/charts/RadialGauge';
import { LineTrendChart } from '@/components/charts/LineTrendChart';
import { colors, fontFamily, primaryGradient, liquidGlass } from '@/theme/tokens';
import { formatCurrency, formatCompactCurrency, formatPercent } from '@/utils/format';
import { getCategory } from '@/constants/categories';
import { AnalyticsStackParamList } from '@/navigation/types';
import { useGetAnalyticsSummaryQuery, useGetAnalyticsCategoriesQuery, useGetHealthScoreQuery } from '@/store/api/analyticsApi';

type Nav = NativeStackNavigationProp<AnalyticsStackParamList>;

interface SlideShellProps {
  width: number;
  gradient: readonly [string, string, ...string[]];
  icon: IconComponent;
  eyebrow: string;
  luna: string;
  children?: ReactNode;
}

function SlideShell({ width, gradient, icon: Icon, eyebrow, luna, children }: SlideShellProps) {
  return (
    <LinearGradient
      colors={gradient}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{ width, flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 28 }}
    >
      <Animated.View entering={FadeInUp.delay(150).springify()} style={{ alignItems: 'center', gap: 14, maxWidth: 340 }}>
        <LiquidGlassSurface
          radius={18}
          borderWidth={1.3}
          intensity={liquidGlass.blurButton}
          contentStyle={{ width: 60, height: 60, alignItems: 'center', justifyContent: 'center' }}
        >
          <Icon size={34} color={colors.inkOnPrimary} />
        </LiquidGlassSurface>
        <Text
          style={{
            color: 'rgba(4,20,11,0.7)',
            fontFamily: fontFamily.bold,
            fontSize: 12.5,
            letterSpacing: 1.2,
            textTransform: 'uppercase',
          }}
        >
          {eyebrow}
        </Text>
        {children}
        <View style={{ backgroundColor: 'rgba(4,20,11,0.14)', borderRadius: 18, padding: 16, marginTop: 6 }}>
          <Text style={{ color: 'rgba(4,20,11,0.85)', fontFamily: fontFamily.medium, fontSize: 13.5, lineHeight: 20, textAlign: 'center' }}>
            {luna}
          </Text>
        </View>
      </Animated.View>
    </LinearGradient>
  );
}

function SlideTitle({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <>
      <Text style={{ color: colors.inkOnPrimary, fontFamily: fontFamily.extrabold, fontSize: 32, textAlign: 'center' }}>{title}</Text>
      {!!subtitle && <Text style={{ color: 'rgba(4,20,11,0.75)', fontFamily: fontFamily.bold, fontSize: 15 }}>{subtitle}</Text>}
    </>
  );
}

const SLIDE_COUNT = 5;

export function YearInReviewScreen() {
  const navigation = useNavigation<Nav>();
  const { width } = useWindowDimensions();
  const [page, setPage] = useState(0);

  const { data: summary, isLoading: summaryLoading } = useGetAnalyticsSummaryQuery();
  const { data: categories, isLoading: categoriesLoading } = useGetAnalyticsCategoriesQuery();
  const { data: health, isLoading: healthLoading } = useGetHealthScoreQuery();

  const isLoading = summaryLoading || categoriesLoading || healthLoading;

  if (isLoading || !summary || !categories || !health) {
    return (
      <Screen>
        <View style={{ flex: 1, padding: 20, justifyContent: 'center' }}>
          <Skeleton height={500} radius={28} />
        </View>
      </Screen>
    );
  }

  const annualIncome = summary.income * 12;
  const annualExpense = summary.expense * 12;
  const annualSavings = Math.max(0, annualIncome - annualExpense);
  const savingsRate = annualIncome > 0 ? (annualSavings / annualIncome) * 100 : 0;

  const topCategory = categories[0];
  const topCategoryDef = topCategory ? getCategory(topCategory.category) : null;
  const topCategoryColor = topCategoryDef?.color ?? colors.primary500;

  const score = health.current.score;
  const scoreHistoryPoints = [...health.history].reverse().map((h) => ({ date: h.date, value: h.score }));

  const onScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    setPage(Math.round(e.nativeEvent.contentOffset.x / width));
  };

  return (
    <Screen aurora={false}>
      <View style={{ position: 'absolute', top: 8, left: 16, zIndex: 10 }}>
        <IconButton variant="glass" size={40} icon={<ArrowLeft size={18} color={colors.ink} />} onPress={() => navigation.goBack()} />
      </View>

      <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false} onMomentumScrollEnd={onScrollEnd} style={{ flex: 1 }}>
        <SlideShell
          width={width}
          gradient={primaryGradient}
          icon={Sparkles}
          eyebrow="Your Year Recap"
          luna={`Hey, it's LUNA. You moved ${formatCompactCurrency(annualExpense)} through your accounts this year — that's a lot of swipes, taps, and UPI pings. Let's look back at the highlights.`}
        >
          <SlideTitle title={formatCurrency(annualExpense)} subtitle="Total spent this year (estimated)" />
        </SlideShell>

        <SlideShell
          width={width}
          gradient={[`${topCategoryColor}CC`, `${topCategoryColor}55`] as const}
          icon={topCategoryDef?.icon ?? Sparkles}
          eyebrow="Top Category"
          luna={
            topCategory
              ? `${topCategoryDef?.label} was your biggest spend category — about ${formatPercent(topCategory.pctOfTotal)} of your monthly spend. No judgment, just data.`
              : `You kept spending nicely spread out this year — no single category dominated your budget.`
          }
        >
          <SlideTitle
            title={topCategoryDef?.label ?? 'Balanced Spending'}
            subtitle={topCategory ? `${formatCurrency(topCategory.amount * 12)} estimated this year` : undefined}
          />
        </SlideShell>

        <SlideShell
          width={width}
          gradient={['#22E37A', '#0B8A48'] as const}
          icon={PiggyBank}
          eyebrow="Income & Savings"
          luna={`On ${formatCompactCurrency(annualIncome)} of income this year, you tucked away ${formatCompactCurrency(annualSavings)}. Keep this up and future-you will send a thank-you note.`}
        >
          <SlideTitle title={formatCurrency(annualSavings)} subtitle={`Saved at a ${formatPercent(savingsRate)} rate`} />
        </SlideShell>

        <SlideShell
          width={width}
          gradient={['#7CFF9E', '#0FAE5C'] as const}
          icon={TrophyIcon}
          eyebrow="Health Score Journey"
          luna={`Your financial health score is trending ${score >= 700 ? 'strong' : 'steady'}. Consistency beats intensity — small habits compounded all year.`}
        >
          <RadialGauge progress={(score / 1000) * 100} size={150} strokeWidth={13} color={colors.inkOnPrimary} trackColor="rgba(4,20,11,0.18)">
            <Text style={{ color: colors.inkOnPrimary, fontFamily: fontFamily.extrabold, fontSize: 32 }}>{score}</Text>
            <Text style={{ color: 'rgba(4,20,11,0.6)', fontFamily: fontFamily.semibold, fontSize: 11 }}>out of 1000</Text>
          </RadialGauge>
          {scoreHistoryPoints.length > 1 && (
            <View style={{ width: '100%', marginTop: 4 }}>
              <LineTrendChart points={scoreHistoryPoints} color={colors.inkOnPrimary} height={64} showArea={false} />
            </View>
          )}
        </SlideShell>

        <SlideShell
          width={width}
          gradient={['#B6FF4D', '#14C56A'] as const}
          icon={PartyPopper}
          eyebrow="See You Next Year"
          luna="Thanks for letting me tag along on your money journey this year. Here's to smarter spending, bigger savings, and fewer surprise charges ahead."
        >
          <SlideTitle title="That's a wrap" />
          <PrimaryButton label="Done" onPress={() => navigation.goBack()} style={{ marginTop: 10, width: 200 }} fullWidth={false} />
        </SlideShell>
      </ScrollView>

      <View style={{ position: 'absolute', bottom: 28, left: 0, right: 0, flexDirection: 'row', justifyContent: 'center', gap: 6 }}>
        {Array.from({ length: SLIDE_COUNT }).map((_, i) => (
          <View
            key={i}
            style={{
              width: i === page ? 20 : 6,
              height: 6,
              borderRadius: 3,
              backgroundColor: i === page ? colors.inkOnPrimary : 'rgba(4,20,11,0.35)',
            }}
          />
        ))}
      </View>
    </Screen>
  );
}
