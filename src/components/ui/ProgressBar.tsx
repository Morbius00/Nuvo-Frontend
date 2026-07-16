import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withDelay, Easing } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, radii } from '@/theme/tokens';

interface ProgressBarProps {
  progress: number; // 0-100
  color?: string;
  trackColor?: string;
  height?: number;
  gradient?: readonly [string, string, ...string[]];
  delay?: number;
}

export function ProgressBar({ progress, color = colors.primary500, trackColor, height = 10, gradient, delay = 0 }: ProgressBarProps) {
  const width = useSharedValue(0);

  useEffect(() => {
    width.value = withDelay(
      delay,
      withTiming(Math.min(100, Math.max(0, progress)), { duration: 900, easing: Easing.out(Easing.cubic) }),
    );
  }, [progress, delay, width]);

  const style = useAnimatedStyle(() => ({ width: `${width.value}%` }));

  return (
    <View
      style={{
        height,
        borderRadius: radii.pill,
        backgroundColor: trackColor ?? colors.glassFillStrong,
        overflow: 'hidden',
      }}
    >
      <Animated.View style={[style, { height: '100%', borderRadius: radii.pill, overflow: 'hidden' }]}>
        {gradient ? (
          <LinearGradient
            colors={gradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{ flex: 1 }}
          />
        ) : (
          <View style={{ flex: 1, backgroundColor: color }} />
        )}
      </Animated.View>
    </View>
  );
}
