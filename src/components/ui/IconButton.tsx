import { ReactNode } from 'react';
import { Pressable, Text, View, StyleProp, ViewStyle } from 'react-native';
import Animated from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, primaryGradientSoft, fontFamily, liquidGlass } from '@/theme/tokens';
import { usePressScale } from '@/hooks/usePressScale';
import { LiquidGlassSurface } from './LiquidGlassSurface';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface IconButtonProps {
  icon: ReactNode;
  label?: string;
  onPress?: () => void;
  size?: number;
  variant?: 'solid' | 'glass';
  style?: StyleProp<ViewStyle>;
}

/** Circular action button (Add Cash / Cash Out / Activity style, ref screenshot 4). */
export function IconButton({ icon, label, onPress, size = 56, variant = 'solid', style }: IconButtonProps) {
  const press = usePressScale();

  return (
    <View style={{ alignItems: 'center', gap: 8 }}>
      <AnimatedPressable
        onPress={() => press.onPress(onPress)}
        onPressIn={press.onPressIn}
        onPressOut={press.onPressOut}
        style={[press.style, style]}
      >
        {variant === 'solid' ? (
          <LinearGradient
            colors={primaryGradientSoft}
            style={{
              width: size,
              height: size,
              borderRadius: size / 2,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {icon}
          </LinearGradient>
        ) : (
          <LiquidGlassSurface
            radius={size / 2}
            borderWidth={1.5}
            intensity={liquidGlass.blurButton}
            fill={colors.glassFillStrong}
            pressProgress={press.pressed}
            contentStyle={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}
          >
            {icon}
          </LiquidGlassSurface>
        )}
      </AnimatedPressable>
      {label && (
        <Text style={{ color: colors.inkSecondary, fontFamily: fontFamily.medium, fontSize: 12 }}>{label}</Text>
      )}
    </View>
  );
}
