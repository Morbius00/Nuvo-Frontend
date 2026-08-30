import { useEffect, useRef } from 'react';
import { Image, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  interpolate,
  Easing,
} from 'react-native-reanimated';
import { colors } from '@/theme/tokens';

const MIN_VISIBLE_MS = 900;
const EXIT_DURATION = 380;

interface AppSplashProps {
  /** Flip to true once fonts are loaded and redux-persist has rehydrated. */
  ready: boolean;
  onFinish: () => void;
}

/** Animated launch splash shown over the native splash screen — logo only, no text. */
export function AppSplash({ ready, onFinish }: AppSplashProps) {
  const mountedAt = useRef(Date.now());
  const exitStarted = useRef(false);

  const entrance = useSharedValue(0);
  const float = useSharedValue(0);
  const exitProgress = useSharedValue(0);

  useEffect(() => {
    entrance.value = withTiming(1, { duration: 520, easing: Easing.out(Easing.back(1.4)) });
    float.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1600, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: 1600, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      false,
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!ready || exitStarted.current) return;
    exitStarted.current = true;
    const elapsed = Date.now() - mountedAt.current;
    const wait = Math.max(0, MIN_VISIBLE_MS - elapsed);
    let finishTimer: ReturnType<typeof setTimeout> | undefined;
    const timer = setTimeout(() => {
      exitProgress.value = withTiming(1, { duration: EXIT_DURATION, easing: Easing.in(Easing.cubic) });
      finishTimer = setTimeout(onFinish, EXIT_DURATION);
    }, wait);
    return () => {
      clearTimeout(timer);
      clearTimeout(finishTimer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);

  const containerStyle = useAnimatedStyle(() => ({
    opacity: 1 - exitProgress.value,
    transform: [{ scale: 1 + exitProgress.value * 0.05 }],
  }));

  const logoStyle = useAnimatedStyle(() => ({
    opacity: entrance.value,
    transform: [
      { perspective: 800 },
      { scale: interpolate(entrance.value, [0, 1], [0.7, 1]) },
      { translateY: interpolate(float.value, [0, 1], [-10, 10]) },
      { rotateY: `${interpolate(float.value, [0, 1], [-9, 9])}deg` },
      { rotateZ: `${interpolate(float.value, [0, 1], [-2, 2])}deg` },
    ],
  }));

  return (
    <Animated.View
      style={[
        StyleSheet.absoluteFill,
        containerStyle,
        { backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center', zIndex: 999, elevation: 999 },
      ]}
      pointerEvents="auto"
    >
      <Animated.View style={logoStyle}>
        <Image source={require('../../../assets/Nuvo-Logo-3d.png')} style={{ width: 152, height: 152 }} resizeMode="contain" />
      </Animated.View>
    </Animated.View>
  );
}
