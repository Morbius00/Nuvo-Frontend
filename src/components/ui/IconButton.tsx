import { ReactNode } from 'react';
import { Pressable, Text, View, StyleProp, ViewStyle } from 'react-native';
import Animated from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, fontFamily, liquidGlass, shadow } from '@/theme/tokens';
import { usePressScale } from '@/hooks/usePressScale';
import { LiquidGlassSurface } from './LiquidGlassSurface';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// Glossy 3D-sphere body: cyan highlight → primary → deep sap green shadow edge.
const SOLID_BODY_GRADIENT = [colors.lime400, colors.primary500, colors.sapGreen600] as const;
// Specular sheen covering the upper half — the "glass" catch-light.
const SOLID_SHEEN_GRADIENT = ['rgba(255,255,255,0.7)', 'rgba(255,255,255,0)'] as const;
// Inner shadow pooling at the base for grounded depth.
const SOLID_BASE_SHADOW_GRADIENT = ['rgba(6,20,10,0)', 'rgba(6,20,10,0.5)'] as const;

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
            <LinearGradient
              colors={SOLID_BODY_GRADIENT}
              start={{ x: 0.18, y: 0.1 }}
              end={{ x: 0.85, y: 0.95 }}
              style={{
                width: size,
                height: size,
                borderRadius: size / 2,
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
                borderWidth: 1,
                borderColor: 'rgba(255,255,255,0.26)',
              }}
            >
              {/* base shadow — pools depth at the bottom of the sphere */}
              <LinearGradient
                colors={SOLID_BASE_SHADOW_GRADIENT}
                pointerEvents="none"
                style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: size * 0.55 }}
              />
              {/* specular sheen — the glass catch-light across the top */}
              <LinearGradient
                colors={SOLID_SHEEN_GRADIENT}
                pointerEvents="none"
                style={{
                  position: 'absolute',
                  top: 0,
                  left: size * 0.08,
                  right: size * 0.08,
                  height: size * 0.5,
                  borderTopLeftRadius: size / 2,
                  borderTopRightRadius: size / 2,
                }}
              />
              {icon}
            </LinearGradient>
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
