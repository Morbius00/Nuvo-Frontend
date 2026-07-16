import { ReactNode } from 'react';
import { Pressable, Text, View, StyleSheet, Platform, StyleProp, ViewStyle } from 'react-native';
import Animated from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { colors, fontFamily, liquidGlass, shadow } from '@/theme/tokens';
import { usePressScale } from '@/hooks/usePressScale';
import { LiquidGlassSurface } from './LiquidGlassSurface';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// Frosted glass wash — lime fading into deep sap green, kept translucent so the blur reads through.
const SOLID_GLASS_TINT = ['rgba(182,255,77,0.30)', 'rgba(34,227,122,0.20)', 'rgba(31,51,18,0.55)'] as const;
const SOLID_GLASS_BORDER = 'rgba(198,255,107,0.32)';

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
          <View style={[{ width: size, height: size, borderRadius: size / 2 }, shadow.glassButton]}>
            <View
              style={{
                width: size,
                height: size,
                borderRadius: size / 2,
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
                borderWidth: 1,
                borderColor: SOLID_GLASS_BORDER,
              }}
            >
              <BlurView
                intensity={liquidGlass.blurButton}
                tint="dark"
                experimentalBlurMethod={Platform.OS === 'android' ? 'dimezisBlurView' : undefined}
                style={StyleSheet.absoluteFill}
              />
              <LinearGradient
                colors={SOLID_GLASS_TINT}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFill}
              />
              {icon}
            </View>
          </View>
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
