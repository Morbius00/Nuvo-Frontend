import { useCallback } from 'react';
import { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

interface Options {
  scaleTo?: number;
  haptic?: boolean;
}

/** Shared spring-scale press feedback used by every tappable surface in the app. */
export function usePressScale({ scaleTo = 0.96, haptic = true }: Options = {}) {
  const scale = useSharedValue(1);
  /** 0→1 on press, used by LiquidGlassSurface to brighten its specular sheen on touch. */
  const pressed = useSharedValue(0);

  const style = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  const onPressIn = useCallback(() => {
    scale.value = withSpring(scaleTo, { damping: 16, stiffness: 260 });
    pressed.value = withSpring(1, { damping: 16, stiffness: 260 });
  }, [scale, pressed, scaleTo]);

  const onPressOut = useCallback(() => {
    scale.value = withSpring(1, { damping: 14, stiffness: 220 });
    pressed.value = withSpring(0, { damping: 14, stiffness: 220 });
  }, [scale, pressed]);

  const onPress = useCallback(
    (fn?: () => void) => {
      if (haptic) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      fn?.();
    },
    [haptic],
  );

  return { style, onPressIn, onPressOut, onPress, pressed };
}
