import { ReactNode } from 'react';
import { View, Pressable, ViewStyle, StyleProp } from 'react-native';
import Animated from 'react-native-reanimated';
import { radii, shadow, liquidGlass } from '@/theme/tokens';
import { usePressScale } from '@/hooks/usePressScale';
import { LiquidGlassSurface } from './LiquidGlassSurface';
import { cn } from '@/utils/cn';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
  intensity?: number;
  tint?: 'dark' | 'light' | 'default';
  radius?: number;
  glow?: string;
  bordered?: boolean;
}

/**
 * The single glassmorphism primitive used for every card/panel/sheet/tab-bar in
 * the app — a Liquid Glass material (blur + depth vignette + animated specular
 * sheen + gradient-lit edge) built on LiquidGlassSurface.
 */
export function GlassCard({
  children,
  className,
  style,
  onPress,
  intensity = liquidGlass.blurCard,
  tint = 'dark',
  radius = radii.xl,
  glow,
  bordered = true,
}: GlassCardProps) {
  const press = usePressScale({ scaleTo: 0.98 });

  const content = (
    <View style={[{ borderRadius: radius }, style]}>
      <LiquidGlassSurface
        radius={radius}
        borderWidth={bordered ? 0.8 : 0}
        intensity={intensity}
        tint={tint}
        pressProgress={onPress ? press.pressed : undefined}
      >
        <View className={cn(className)}>{children}</View>
      </LiquidGlassSurface>
    </View>
  );

  if (!onPress) return content;

  return (
    <AnimatedPressable
      onPress={() => press.onPress(onPress)}
      onPressIn={press.onPressIn}
      onPressOut={press.onPressOut}
      style={press.style}
    >
      {content}
    </AnimatedPressable>
  );
}
