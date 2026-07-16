import { useEffect, useState } from 'react';
import { View, LayoutChangeEvent } from 'react-native';
import Svg, { Circle, Line } from 'react-native-svg';
import Animated, { useSharedValue, useAnimatedProps, withDelay, withTiming, Easing } from 'react-native-reanimated';
import { colors } from '@/theme/tokens';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

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

/** Simple SVG scatter of transaction amounts over time — anomalies pop larger + red. */
export function ScatterAnomalyChart({ points, onPointPress, height = 180 }: ScatterAnomalyChartProps) {
  const [width, setWidth] = useState(0);
  const onLayout = (e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width);

  const padding = 16;
  const amounts = points.map((p) => p.amount);
  const maxAmount = amounts.length ? Math.max(...amounts) : 1;
  const times = points.map((p) => new Date(p.date).getTime());
  const minT = times.length ? Math.min(...times) : 0;
  const maxT = times.length ? Math.max(...times) : 1;
  const tRange = maxT - minT || 1;

  return (
    <View onLayout={onLayout} style={{ height, width: '100%' }}>
      {width > 0 && (
        <Svg width={width} height={height}>
          <Line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke={colors.hairline} strokeWidth={1} />
          {points.map((p, i) => {
            const x = tRange > 0 ? padding + ((new Date(p.date).getTime() - minT) / tRange) * (width - padding * 2) : width / 2;
            const y = padding + (1 - p.amount / (maxAmount || 1)) * (height - padding * 2);
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
  );
}
