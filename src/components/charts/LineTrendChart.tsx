import { useEffect, useMemo, useState } from 'react';
import { View, LayoutChangeEvent } from 'react-native';
import Svg, { Path, Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import Animated, { useSharedValue, useAnimatedProps, withTiming, Easing } from 'react-native-reanimated';
import { colors } from '@/theme/tokens';

const AnimatedPath = Animated.createAnimatedComponent(Path);

export interface TrendPointLike {
  date: string;
  value: number;
}

interface LineTrendChartProps {
  points: TrendPointLike[];
  comparisonPoints?: TrendPointLike[];
  color?: string;
  height?: number;
  showArea?: boolean;
}

interface Coord {
  x: number;
  y: number;
}

function buildPath(points: TrendPointLike[], width: number, height: number, min: number, max: number, padding = 10) {
  if (points.length === 0) return { path: '', coords: [] as Coord[] };
  const range = max - min || 1;
  const usableWidth = Math.max(1, width - padding * 2);
  const usableHeight = Math.max(1, height - padding * 2);
  const stepX = points.length > 1 ? usableWidth / (points.length - 1) : 0;
  const coords = points.map((p, i) => ({
    x: padding + i * stepX,
    y: padding + (1 - (p.value - min) / range) * usableHeight,
  }));
  const path = coords.map((c, i) => `${i === 0 ? 'M' : 'L'} ${c.x.toFixed(2)} ${c.y.toFixed(2)}`).join(' ');
  return { path, coords };
}

function pathLength(coords: Coord[]) {
  let len = 0;
  for (let i = 1; i < coords.length; i++) {
    len += Math.hypot(coords[i].x - coords[i - 1].x, coords[i].y - coords[i - 1].y);
  }
  return len || 1;
}

/** Cumulative-spend line chart (this period vs prior period), gradient fill, animated draw-in. */
export function LineTrendChart({ points, comparisonPoints, color = colors.primary500, height = 180, showArea = true }: LineTrendChartProps) {
  const [width, setWidth] = useState(0);
  const [gradientId] = useState(() => `lineFill-${Math.random().toString(36).slice(2)}`);
  const progress = useSharedValue(0);

  const onLayout = (e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width);

  const { min, max } = useMemo(() => {
    const values = [...points.map((p) => p.value), ...(comparisonPoints?.map((p) => p.value) ?? [])];
    if (values.length === 0) return { min: 0, max: 1 };
    return { min: Math.min(0, ...values), max: Math.max(...values) };
  }, [points, comparisonPoints]);

  const { path, coords } = useMemo(() => buildPath(points, width || 1, height, min, max), [points, width, height, min, max]);
  const { path: comparisonPath } = useMemo(
    () => (comparisonPoints ? buildPath(comparisonPoints, width || 1, height, min, max) : { path: '', coords: [] as Coord[] }),
    [comparisonPoints, width, height, min, max],
  );

  const areaPath = useMemo(() => {
    if (!path || coords.length === 0) return '';
    const last = coords[coords.length - 1];
    const first = coords[0];
    return `${path} L ${last.x.toFixed(2)} ${height} L ${first.x.toFixed(2)} ${height} Z`;
  }, [path, coords, height]);

  const length = useMemo(() => pathLength(coords), [coords]);

  useEffect(() => {
    progress.value = 0;
    progress.value = withTiming(1, { duration: 900, easing: Easing.out(Easing.cubic) });
  }, [path, progress]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: length * (1 - progress.value),
  }));

  return (
    <View onLayout={onLayout} style={{ height, width: '100%' }}>
      {width > 0 && (
        <Svg width={width} height={height}>
          <Defs>
            <LinearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={color} stopOpacity={0.32} />
              <Stop offset="1" stopColor={color} stopOpacity={0} />
            </LinearGradient>
          </Defs>
          {showArea && !!areaPath && <Path d={areaPath} fill={`url(#${gradientId})`} stroke="none" />}
          {!!comparisonPath && (
            <Path d={comparisonPath} stroke={colors.inkMuted} strokeWidth={2} fill="none" strokeDasharray="5 5" strokeLinecap="round" />
          )}
          {!!path && (
            <AnimatedPath
              d={path}
              stroke={color}
              strokeWidth={3}
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray={length}
              animatedProps={animatedProps}
            />
          )}
          {coords.length > 0 && <Circle cx={coords[coords.length - 1].x} cy={coords[coords.length - 1].y} r={4} fill={color} />}
        </Svg>
      )}
    </View>
  );
}
