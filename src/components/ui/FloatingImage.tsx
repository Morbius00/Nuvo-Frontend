import { useEffect } from 'react';
import { ImageSourcePropType, StyleProp, ImageStyle } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withSequence, withTiming, Easing } from 'react-native-reanimated';

interface FloatingImageProps {
  source: ImageSourcePropType;
  size: number;
  style?: StyleProp<ImageStyle>;
}

/** Gentle infinite up/down bob — same easing/timing as WelcomeScreen's logo float. */
export function FloatingImage({ source, size, style }: FloatingImageProps) {
  const y = useSharedValue(0);

  useEffect(() => {
    y.value = withRepeat(
      withSequence(
        withTiming(-10, { duration: 2300, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: 2300, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      true,
    );
  }, [y]);

  const floatStyle = useAnimatedStyle(() => ({ transform: [{ translateY: y.value }] }));

  return <Animated.Image source={source} style={[{ width: size, height: size, resizeMode: 'contain' }, floatStyle, style]} />;
}
