import { useEffect, useState } from 'react';
import { View, Text, LayoutChangeEvent } from 'react-native';
import Svg, { Circle, Line } from 'react-native-svg';
import Animated, { useSharedValue, useAnimatedProps, withDelay, withTiming, Easing } from 'react-native-reanimated';
import { colors, fontFamily } from '@/theme/tokens';
import { formatCompactCurrency, formatDay } from '@/utils/format';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const Y_AXIS_WIDTH = 46;
const TICK_COUNT = 4;

export interface ScatterPoint {
  date: string;
  amount: number;
  isAnomalous: boolean;
}

interface ScatterAnomalyChartProps {
  points: ScatterPoint[];
  onPointPress?: (index: number) => void;
  height?: number;
}

interface DotProps {
  cx: number;
  cy: number;
  radius: number;
  color: string;
  delay: number;
  onPress?: () => void;
}

function Dot({ cx, cy, radius, color, delay, onPress }: DotProps) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = 0;
    progress.value = withDelay(delay, withTiming(1, { duration: 420, easing: Easing.out(Easing.cubic) }));
  }, [delay, progress]);

  const animatedProps = useAnimatedProps(() => ({
    r: radius * progress.value,
    opacity: progress.value,
  }));

  return (
    <>
      <AnimatedCircle cx={cx} cy={cy} fill={color} animatedProps={animatedProps} />
      {onPress && <Circle cx={cx} cy={cy} r={16} fill="transparent" onPress={onPress} />}
    </>
  );
}

/** SVG scatter of transaction amounts over time, with axis scale + a legend so the dots are self-explanatory. */
export function ScatterAnomalyChart({ points, onPointPress, height = 180 }: ScatterAnomalyChartProps) {
  const [width, setWidth] = useState(0);
  const onLayout = (e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width);

  const padding = 10;
  const amounts = points.map((p) => p.amount);
  const rawMax = amounts.length ? Math.max(...amounts) : 1;
  const maxAmount = rawMax * 1.15 || 1; // headroom so the tallest dot doesn't kiss the top gridline
  const times = points.map((p) => new Date(p.date).getTime());
  const minT = times.length ? Math.min(...times) : 0;
  const maxT = times.length ? Math.max(...times) : 1;
  const tRange = maxT - minT || 1;

  const ticks = Array.from({ length: TICK_COUNT + 1 }, (_, i) => (maxAmount / TICK_COUNT) * i).reverse();
  const tickY = (t: number) => padding + (1 - t / maxAmount) * (height - padding * 2);

  return (
    <View>
      <View style={{ flexDirection: 'row' }}>
        <View style={{ width: Y_AXIS_WIDTH, height }}>
          {ticks.map((t, i) => (
            <Text
              key={i}
              style={{
                position: 'absolute',
                top: tickY(t) - 6,
                right: 8,
                color: colors.inkMuted,
                fontFamily: fontFamily.medium,
                fontSize: 10,
              }}
            >
              {formatCompactCurrency(t)}
            </Text>
          ))}
        </View>
        <View onLayout={onLayout} style={{ flex: 1, height }}>
          {width > 0 && (
            <Svg width={width} height={height}>
              {ticks.map((t, i) => (
                <Line
                  key={i}
                  x1={0}
                  y1={tickY(t)}
                  x2={width}
                  y2={tickY(t)}
                  stroke={colors.hairline}
                  strokeWidth={1}
                  strokeDasharray={i === ticks.length - 1 ? undefined : '3 4'}
                />
              ))}
              {points.map((p, i) => {
                const x = tRange > 0 ? padding + ((new Date(p.date).getTime() - minT) / tRange) * (width - padding * 2) : width / 2;
                const y = tickY(p.amount);
                return (
                  <Dot
                    key={i}
                    cx={x}
                    cy={y}
                    radius={p.isAnomalous ? 8 : 4.5}
                    color={p.isAnomalous ? colors.danger500 : colors.primary400}
                    delay={i * 18}
                    onPress={onPointPress ? () => onPointPress(i) : undefined}
                  />
                );
              })}
            </Svg>
          )}
        </View>
      </View>

      {points.length > 0 && (
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginLeft: Y_AXIS_WIDTH, marginTop: 4 }}>
          <Text style={{ color: colors.inkMuted, fontFamily: fontFamily.medium, fontSize: 10.5 }}>{formatDay(points[0].date)}</Text>
          <Text style={{ color: colors.inkMuted, fontFamily: fontFamily.medium, fontSize: 10.5 }}>
            {formatDay(points[points.length - 1].date)}
          </Text>
        </View>
      )}

      <View style={{ flexDirection: 'row', gap: 16, marginTop: 12, marginLeft: Y_AXIS_WIDTH }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primary400 }} />
          <Text style={{ color: colors.inkSecondary, fontFamily: fontFamily.medium, fontSize: 11 }}>Transaction</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: colors.danger500 }} />
          <Text style={{ color: colors.inkSecondary, fontFamily: fontFamily.medium, fontSize: 11 }}>Flagged unusual</Text>
        </View>
      </View>
    </View>
  );
}
