import { useEffect, useState } from 'react';
import { View, Text } from 'react-native';
import Svg, { Polygon, Line, Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import Animated, { SharedValue, useSharedValue, useAnimatedProps, withTiming, Easing } from 'react-native-reanimated';
import { colors, fontFamily } from '@/theme/tokens';

const AnimatedPolygon = Animated.createAnimatedComponent(Polygon);
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export interface RadarDatum {
  label: string;
  value: number;
  max: number;
}

interface RadarChartProps {
  data: RadarDatum[];
  size?: number;
  color?: string;
  /** Optional 2-stop gradient [start, end] for the polygon fill/stroke and vertices — overrides `color`. */
  gradientColors?: readonly [string, string];
  duration?: number;
}

const RINGS = [0.33, 0.66, 1];

function polarPoint(cx: number, cy: number, radius: number, angleDeg: number) {
  'worklet';
  const rad = (angleDeg * Math.PI) / 180;
  return { x: cx + radius * Math.cos(rad), y: cy + radius * Math.sin(rad) };
}

function Vertex({
  cx,
  cy,
  radius,
  angle,
  frac,
  color,
  progress,
}: {
  cx: number;
  cy: number;
  radius: number;
  angle: number;
  frac: number;
  color: string;
  progress: SharedValue<number>;
}) {
  const animatedProps = useAnimatedProps(() => {
    const p = polarPoint(cx, cy, radius * frac * progress.value, angle);
    return { cx: p.x, cy: p.y };
  });
  return <AnimatedCircle r={3.5} fill={color} animatedProps={animatedProps} />;
}

/** Spider/radar chart for an N-dimension scorecard — shows the overall "shape" of a set of 0..max metrics at a glance. */
export function RadarChart({ data, size = 240, color = colors.primary400, gradientColors, duration = 900 }: RadarChartProps) {
  const [uid] = useState(() => Math.random().toString(36).slice(2));
  const strokeColor = gradientColors ? gradientColors[1] : color;
  const n = data.length;
  const cx = size / 2;
  const cy = size / 2;
  const labelPad = 36;
  const radius = size / 2 - labelPad;
  const step = 360 / Math.max(1, n);
  const angles = data.map((_, i) => -90 + i * step);
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = 0;
    progress.value = withTiming(1, { duration, easing: Easing.out(Easing.cubic) });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data.map((d) => d.value).join(','), duration]);

  const animatedProps = useAnimatedProps(() => {
    const pts = data
      .map((d, i) => {
        const frac = Math.max(0, Math.min(1, d.value / (d.max || 1))) * progress.value;
        const { x, y } = polarPoint(cx, cy, radius * frac, angles[i]);
        return `${x},${y}`;
      })
      .join(' ');
    return { points: pts };
  });

  if (n < 3) return null;

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size}>
        {gradientColors && (
          <Defs>
            <LinearGradient id={`radar-fill-${uid}`} x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0%" stopColor={gradientColors[0]} stopOpacity={0.5} />
              <Stop offset="100%" stopColor={gradientColors[1]} stopOpacity={0.16} />
            </LinearGradient>
          </Defs>
        )}
        {RINGS.map((r, ri) => (
          <Polygon
            key={ri}
            points={angles.map((a) => { const p = polarPoint(cx, cy, radius * r, a); return `${p.x},${p.y}`; }).join(' ')}
            fill="none"
            stroke={colors.hairline}
            strokeWidth={1}
          />
        ))}
        {angles.map((a, i) => {
          const p = polarPoint(cx, cy, radius, a);
          return <Line key={i} x1={cx} y1={cy} x2={p.x} y2={p.y} stroke={colors.hairline} strokeWidth={1} />;
        })}
        <AnimatedPolygon
          animatedProps={animatedProps}
          fill={gradientColors ? `url(#radar-fill-${uid})` : `${color}33`}
          stroke={strokeColor}
          strokeWidth={2}
        />
        {data.map((d, i) => (
          <Vertex
            key={i}
            cx={cx}
            cy={cy}
            radius={radius}
            angle={angles[i]}
            frac={Math.max(0, Math.min(1, d.value / (d.max || 1)))}
            color={strokeColor}
            progress={progress}
          />
        ))}
      </Svg>
      {data.map((d, i) => {
        const p = polarPoint(cx, cy, radius + 20, angles[i]);
        return (
          <Text
            key={i}
            numberOfLines={2}
            style={{
              position: 'absolute',
              left: p.x - 42,
              top: p.y - 13,
              width: 84,
              textAlign: 'center',
              color: colors.inkSecondary,
              fontFamily: fontFamily.semibold,
              fontSize: 10,
            }}
          >
            {d.label}
          </Text>
        );
      })}
    </View>
  );
}
