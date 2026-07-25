import { useEffect, useState } from 'react';
import { View, Text } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, RadialGradient, Stop } from 'react-native-svg';
import Animated, { useSharedValue, useAnimatedProps, withDelay, withTiming, Easing } from 'react-native-reanimated';
import { colors, fontFamily, shadow } from '@/theme/tokens';
import { mixHex } from '@/utils/color';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export interface DonutDatum {
  label: string;
  value: number;
  color: string;
}

interface DonutChartProps {
  data: DonutDatum[];
  size?: number;
  strokeWidth?: number;
  centerLabel?: string;
  centerValue?: string;
  onSegmentPress?: (index: number) => void;
}

interface SegmentProps {
  size: number;
  radius: number;
  strokeWidth: number;
  stroke: string;
  circumference: number;
  segmentLength: number;
  dashOffset: number;
  delay: number;
  onPress?: () => void;
}

/**
 * A single donut ring segment. Length/offset are static (standard
 * SVG "circle progress" trick — segmentLength/circumference dasharray +
 * a fixed dashOffset positions the arc at its cumulative angle); only
 * opacity is animated in, mirroring RadialGauge's proven animation style
 * without the risk of animating dasharray math mid-flight.
 */
function DonutSegment({
  size,
  radius,
  strokeWidth,
  stroke,
  circumference,
  segmentLength,
  dashOffset,
  delay,
  onPress,
}: SegmentProps) {
  const opacity = useSharedValue(0);

  useEffect(() => {
    opacity.value = 0;
    opacity.value = withDelay(delay, withTiming(1, { duration: 500, easing: Easing.out(Easing.cubic) }));
  }, [delay, opacity]);

  const animatedProps = useAnimatedProps(() => ({ opacity: opacity.value }));

  return (
    <AnimatedCircle
      cx={size / 2}
      cy={size / 2}
      r={radius}
      stroke={stroke}
      strokeWidth={strokeWidth}
      fill="none"
      strokeLinecap="butt"
      strokeDasharray={`${segmentLength} ${circumference}`}
      strokeDashoffset={dashOffset}
      animatedProps={animatedProps}
      originX={size / 2}
      originY={size / 2}
      rotation={-90}
      onPress={onPress}
    />
  );
}

/** Multi-segment SVG donut for "expense by category" breakdowns. */
export function DonutChart({
  data,
  size = 180,
  strokeWidth = 26,
  centerLabel,
  centerValue,
  onSegmentPress,
}: DonutChartProps) {
  const [uid] = useState(() => Math.random().toString(36).slice(2));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const total = data.reduce((sum, d) => sum + d.value, 0) || 1;
  const gap = data.length > 1 ? circumference * 0.012 : 0;
  const cx = size / 2;
  const cy = size / 2;

  let cumulative = 0;
  const segments = data.map((d, i) => {
    const rawLength = (d.value / total) * circumference;
    const segmentLength = Math.max(0, rawLength - gap);
    const dashOffset = circumference - cumulative;
    cumulative += rawLength;
    return { ...d, segmentLength, dashOffset, delay: i * 90 };
  });

  const dominant = segments.reduce((a, b) => (b.value > a.value ? b : a), segments[0]);

  return (
    <View
      style={{
        width: size,
        height: size,
        alignItems: 'center',
        justifyContent: 'center',
        ...shadow.glow(dominant?.color ?? colors.primary500),
        shadowOpacity: 0.2,
        shadowRadius: size * 0.12,
      }}
    >
      <Svg width={size} height={size}>
        <Defs>
          <RadialGradient id={`dish-${uid}`} cx={cx} cy={size * 0.42} r={size * 0.65} gradientUnits="userSpaceOnUse">
            <Stop offset="0%" stopColor="#FFFFFF" stopOpacity={0.06} />
            <Stop offset="100%" stopColor="#FFFFFF" stopOpacity={0} />
          </RadialGradient>
          <LinearGradient id={`sheen-${uid}`} x1={size * 0.15} y1={0} x2={size * 0.85} y2={size} gradientUnits="userSpaceOnUse">
            <Stop offset="0%" stopColor="#FFFFFF" stopOpacity={0.12} />
            <Stop offset="100%" stopColor="#FFFFFF" stopOpacity={0} />
          </LinearGradient>
          {segments.map((s, i) => (
            <LinearGradient key={`grad-${i}`} id={`seg-${i}-${uid}`} x1={0} y1={0} x2={size} y2={size} gradientUnits="userSpaceOnUse">
              <Stop offset="0%" stopColor={mixHex(s.color, 255, 0.4)} />
              <Stop offset="55%" stopColor={s.color} />
              <Stop offset="100%" stopColor={mixHex(s.color, 0, 0.15)} />
            </LinearGradient>
          ))}
        </Defs>

        {/* frosted glass dish behind the ring */}
        <Circle cx={cx} cy={cy} r={radius - strokeWidth / 2 - 3} fill={`url(#dish-${uid})`} />

        {/* track groove + glassy sheen */}
        <Circle cx={cx} cy={cy} r={radius} stroke={colors.glassFillStrong} strokeWidth={strokeWidth} fill="none" />
        <Circle cx={cx} cy={cy} r={radius} stroke={`url(#sheen-${uid})`} strokeWidth={strokeWidth * 0.6} fill="none" />

        {segments.map((s, i) => (
          <DonutSegment
            key={`${s.label}-${i}`}
            size={size}
            radius={radius}
            strokeWidth={strokeWidth}
            stroke={`url(#seg-${i}-${uid})`}
            circumference={circumference}
            segmentLength={s.segmentLength}
            dashOffset={s.dashOffset}
            delay={s.delay}
            onPress={onSegmentPress ? () => onSegmentPress(i) : undefined}
          />
        ))}
      </Svg>
      {(centerLabel || centerValue) && (
        <View style={{ position: 'absolute', alignItems: 'center' }}>
          {centerValue && (
            <Text style={{ color: colors.ink, fontFamily: fontFamily.extrabold, fontSize: size * 0.145 }}>{centerValue}</Text>
          )}
          {centerLabel && (
            <Text style={{ color: colors.inkMuted, fontFamily: fontFamily.semibold, fontSize: 11, marginTop: 2 }}>
              {centerLabel}
            </Text>
          )}
        </View>
      )}
    </View>
  );
}
