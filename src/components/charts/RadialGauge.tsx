import { ReactNode, useEffect, useState } from 'react';
import { View } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, RadialGradient, Stop } from 'react-native-svg';
import Animated, { useSharedValue, useAnimatedProps, withTiming, Easing } from 'react-native-reanimated';
import { colors, shadow } from '@/theme/tokens';
import { mixHex } from '@/utils/color';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface RadialGaugeProps {
  progress: number; // 0-100
  size?: number;
  strokeWidth?: number;
  color?: string;
  /** Optional 2-stop gradient [start, end] to paint the progress arc — overrides the lit single-hue tube. */
  colors?: readonly [string, string];
  trackColor?: string;
  children?: ReactNode;
  duration?: number;
}

/** Gloss streak covers only the first slice of the ring so it never outruns a low fill. */
const HIGHLIGHT_SPAN_PCT = 20;
/** Below this stroke width the gloss streak + tip bead read as clutter rather than depth. */
const MIN_STROKE_FOR_EMBELLISHMENT = 10;

export function RadialGauge({
  progress,
  size = 160,
  strokeWidth = 14,
  color = colors.primary500,
  colors: gradientColors,
  trackColor = colors.glassFillStrong,
  children,
  duration = 1100,
}: RadialGaugeProps) {
  const [uid] = useState(() => Math.random().toString(36).slice(2));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const animatedProgress = useSharedValue(0);
  const embellish = strokeWidth >= MIN_STROKE_FOR_EMBELLISHMENT;
  const arcStart = gradientColors ? gradientColors[0] : mixHex(color, 255, 0.4);
  const arcEnd = gradientColors ? gradientColors[1] : mixHex(color, 0, 0.28);
  const knobColor = gradientColors ? gradientColors[1] : color;

  useEffect(() => {
    animatedProgress.value = withTiming(Math.min(100, Math.max(0, progress)), {
      duration,
      easing: Easing.out(Easing.cubic),
    });
  }, [progress, duration, animatedProgress]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: circumference * (1 - animatedProgress.value / 100),
  }));

  const highlightProps = useAnimatedProps(() => ({
    strokeDashoffset: circumference * (1 - Math.min(animatedProgress.value, HIGHLIGHT_SPAN_PCT) / 100),
  }));

  // Traces the leading edge of the fill so the bead always sits exactly at the tip.
  const knobProps = useAnimatedProps(() => {
    const angle = (-90 + (animatedProgress.value / 100) * 360) * (Math.PI / 180);
    return {
      cx: size / 2 + radius * Math.cos(angle),
      cy: size / 2 + radius * Math.sin(angle),
    };
  });

  const cx = size / 2;
  const cy = size / 2;
  const knobRadius = strokeWidth * 0.46;
  const glow = shadow.glow(knobColor);

  return (
    <View
      style={{
        width: size,
        height: size,
        alignItems: 'center',
        justifyContent: 'center',
        ...glow,
        shadowOpacity: 0.24,
        shadowRadius: size * 0.14,
      }}
    >
      <Svg width={size} height={size}>
        <Defs>
          <RadialGradient id={`dish-${uid}`} cx={cx} cy={size * 0.42} r={size * 0.65} gradientUnits="userSpaceOnUse">
            <Stop offset="0%" stopColor="#FFFFFF" stopOpacity={0.06} />
            <Stop offset="100%" stopColor="#FFFFFF" stopOpacity={0} />
          </RadialGradient>
          <LinearGradient id={`sheen-${uid}`} x1={size * 0.15} y1={0} x2={size * 0.85} y2={size} gradientUnits="userSpaceOnUse">
            <Stop offset="0%" stopColor="#FFFFFF" stopOpacity={0.14} />
            <Stop offset="100%" stopColor="#FFFFFF" stopOpacity={0} />
          </LinearGradient>
          <LinearGradient id={`progress-${uid}`} x1={0} y1={0} x2={size} y2={size} gradientUnits="userSpaceOnUse">
            <Stop offset="0%" stopColor={arcStart} />
            <Stop offset="55%" stopColor={gradientColors ? mixHex(arcEnd, 255, 0.35) : color} />
            <Stop offset="100%" stopColor={arcEnd} />
          </LinearGradient>
          {embellish && (
            <RadialGradient id={`knob-${uid}`} cx="0.35" cy="0.3" r="0.7">
              <Stop offset="0%" stopColor="#FFFFFF" stopOpacity={0.95} />
              <Stop offset="45%" stopColor={knobColor} stopOpacity={1} />
              <Stop offset="100%" stopColor={mixHex(knobColor, 0, 0.3)} stopOpacity={1} />
            </RadialGradient>
          )}
        </Defs>

        {/* frosted glass dish behind the ring */}
        <Circle cx={cx} cy={cy} r={radius - strokeWidth / 2 - 3} fill={`url(#dish-${uid})`} />

        {/* track groove + glassy sheen */}
        <Circle cx={cx} cy={cy} r={radius} stroke={trackColor} strokeWidth={strokeWidth} fill="none" />
        <Circle cx={cx} cy={cy} r={radius} stroke={`url(#sheen-${uid})`} strokeWidth={strokeWidth * 0.6} fill="none" />

        {/* progress arc, lit like a glossy 3D tube */}
        <AnimatedCircle
          cx={cx}
          cy={cy}
          r={radius}
          stroke={`url(#progress-${uid})`}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          animatedProps={animatedProps}
          originX={cx}
          originY={cy}
          rotation={-90}
        />

        {embellish && (
          <>
            {/* reflection streak along the top of the fill */}
            <AnimatedCircle
              cx={cx}
              cy={cy}
              r={radius}
              stroke="rgba(255,255,255,0.55)"
              strokeWidth={strokeWidth * 0.28}
              fill="none"
              strokeLinecap="round"
              strokeDasharray={circumference}
              animatedProps={highlightProps}
              originX={cx}
              originY={cy}
              rotation={-90}
            />

            {/* glowing tip bead at the leading edge of the fill */}
            <AnimatedCircle r={knobRadius * 1.9} fill={knobColor} opacity={0.3} animatedProps={knobProps} />
            <AnimatedCircle r={knobRadius} fill={`url(#knob-${uid})`} animatedProps={knobProps} />
          </>
        )}
      </Svg>
      <View style={{ position: 'absolute', alignItems: 'center', justifyContent: 'center' }}>{children}</View>
    </View>
  );
}
