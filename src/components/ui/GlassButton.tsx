import { ReactNode } from 'react';
import { Pressable, Text, ViewStyle, StyleProp } from 'react-native';
import Animated from 'react-native-reanimated';
import { colors, radii, fontFamily, liquidGlass, shadow } from '@/theme/tokens';
import { usePressScale } from '@/hooks/usePressScale';
import { LiquidGlassSurface } from './LiquidGlassSurface';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface GlassButtonProps {
  label: string;
  onPress?: () => void;
  icon?: ReactNode;
  size?: 'md' | 'lg';
  style?: StyleProp<ViewStyle>;
  variant?: 'default' | 'danger';
}

const DANGER_EDGE = ['rgba(255,92,92,0.5)', 'rgba(255,92,92,0.16)', 'rgba(255,92,92,0.03)'] as const;

export function GlassButton({ label, onPress, icon, size = 'lg', style, variant = 'default' }: GlassButtonProps) {
  const press = usePressScale();
  const height = size === 'lg' ? 56 : 46;
  const isDanger = variant === 'danger';

  return (
    <AnimatedPressable
      onPress={() => press.onPress(onPress)}
      onPressIn={press.onPressIn}
      onPressOut={press.onPressOut}
      style={[press.style, style]}
    >
      <LiquidGlassSurface
        radius={radii.pill}
        borderWidth={0.8}
        intensity={liquidGlass.blurButton}
        fill={isDanger ? 'rgba(255,92,92,0.12)' : colors.glassFillStrong}
        edgeColors={isDanger ? DANGER_EDGE : undefined}
        pressProgress={press.pressed}
        contentStyle={{
          height,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          paddingHorizontal: 20,
        }}
      >
        {icon}
        <Text
          style={{
            color: isDanger ? colors.danger400 : colors.ink,
            fontFamily: fontFamily.semibold,
            fontSize: 15,
          }}
        >
          {label}
        </Text>
      </LiquidGlassSurface>
    </AnimatedPressable>
  );
}
