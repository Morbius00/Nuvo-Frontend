import { View, Text, ScrollView } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { colors, fontFamily } from '@/theme/tokens';
import { formatCompactCurrency } from '@/utils/format';

export interface WaterfallStep {
  label: string;
  value: number;
  type: 'start' | 'positive' | 'negative' | 'end';
}

interface WaterfallChartProps {
  steps: WaterfallStep[];
  height?: number;
}

interface Bar extends WaterfallStep {
  from: number;
  to: number;
}

function computeBars(steps: WaterfallStep[]): Bar[] {
  let running = 0;
  return steps.map((step) => {
    if (step.type === 'start') {
      running = step.value;
      return { ...step, from: 0, to: running };
    }
    if (step.type === 'end') {
      return { ...step, from: 0, to: step.value };
    }
    const from = running;
    running -= Math.abs(step.value);
    return { ...step, from, to: running };
  });
}

/** Cash-flow waterfall: income -> expense categories -> net savings, floating bars. */
export function WaterfallChart({ steps, height = 220 }: WaterfallChartProps) {
  const bars = computeBars(steps);
  const maxVal = Math.max(1, ...bars.flatMap((b) => [b.from, b.to]));
  const barAreaHeight = height - 60;

  return (
    <View style={{ paddingTop: 24 }}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 6, gap: 14 }}>
        {bars.map((b, i) => {
          const top = barAreaHeight - (Math.max(b.from, b.to) / maxVal) * barAreaHeight;
          const barHeight = Math.max(4, (Math.abs(b.to - b.from) / maxVal) * barAreaHeight);
          const color =
            b.type === 'start' || b.type === 'end' ? colors.primary500 : b.type === 'positive' ? colors.primary400 : colors.tierOrange;
          return (
            <Animated.View
              key={`${b.label}-${i}`}
              entering={FadeInUp.delay(i * 90).springify()}
              style={{ alignItems: 'center', width: 60 }}
            >
              <View style={{ height: barAreaHeight, width: '100%' }}>
                <Text
                  numberOfLines={1}
                  style={{
                    position: 'absolute',
                    top: Math.max(0, top - 18),
                    left: 0,
                    right: 0,
                    textAlign: 'center',
                    color: colors.inkSecondary,
                    fontFamily: fontFamily.bold,
                    fontSize: 10.5,
                  }}
                >
                  {formatCompactCurrency(Math.abs(b.value))}
                </Text>
                <View
                  style={{
                    position: 'absolute',
                    top,
                    height: barHeight,
                    width: 38,
                    left: 11,
                    backgroundColor: color,
                    borderRadius: 8,
                  }}
                />
              </View>
              <Text
                numberOfLines={2}
                style={{
                  color: colors.inkMuted,
                  fontFamily: fontFamily.semibold,
                  fontSize: 10.5,
                  marginTop: 10,
                  textAlign: 'center',
                  width: 60,
                }}
              >
                {b.label}
              </Text>
            </Animated.View>
          );
        })}
      </ScrollView>
    </View>
  );
}
