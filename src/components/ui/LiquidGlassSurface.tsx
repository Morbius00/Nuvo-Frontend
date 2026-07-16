import { ReactNode } from 'react';
import { View, StyleSheet, Platform, ViewStyle, StyleProp } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { SharedValue } from 'react-native-reanimated';
import { colors, liquidGlass } from '@/theme/tokens';

interface LiquidGlassSurfaceProps {
  radius: number;
  borderWidth?: number;
  intensity?: number;
  tint?: 'dark' | 'light' | 'default';
  fill?: string;
  // kept for API compatibility — not used in simplified implementation
  animated?: boolean;
  pressProgress?: SharedValue<number>;
  depth?: boolean;
  edgeColors?: readonly [string, string, string];
  children?: ReactNode;
  contentStyle?: StyleProp<ViewStyle>;
  outerStyle?: StyleProp<ViewStyle>;
}

// White → dark → white gradient border — light catches two opposing edges
const BORDER_COLORS = [
  'rgba(255,255,255,0.55)',
  'rgba(15,15,18,0.70)',
  'rgba(255,255,255,0.50)',
] as const;

// Card fill: dark sap green on edges, near-black dominates the centre
const FILL_COLORS = [
  'rgba(7,22,11,0.82)',   // dimmed sap green — left edge
  'rgba(4,10,5,0.75)',    // near-black — centre-left
  'rgba(2,4,2,0.72)',     // deepest black — heart of card
  'rgba(4,10,5,0.75)',    // near-black — centre-right
  'rgba(7,22,11,0.82)',   // dimmed sap green — right edge
] as const;
const FILL_LOCATIONS: [number, number, number, number, number] = [0, 0.18, 0.5, 0.82, 1];

/**
 * Glassmorphism surface:
 * ① Gradient border (white→dark→white)  ② BlurView  ③ dark sap-green→black→sap-green fill
 */
export function LiquidGlassSurface({
  radius,
  borderWidth = 1,
  intensity = liquidGlass.blurCard,
  tint = 'dark',
  fill,          // ignored — fill is now always the gradient
  children,
  contentStyle,
  outerStyle,
}: LiquidGlassSurfaceProps) {
  const inner = radius - borderWidth;
  return (
    /* Gradient wrapper acts as the border */
    <LinearGradient
      colors={BORDER_COLORS}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[{ borderRadius: radius, padding: borderWidth }, outerStyle]}
    >
      <View style={{ borderRadius: inner, overflow: 'hidden', flex: outerStyle ? 1 : undefined }}>
        {/* ① Blur — frosted glass */}
        <BlurView
          intensity={intensity}
          tint={tint}
          experimentalBlurMethod={Platform.OS === 'android' ? 'dimezisBlurView' : undefined}
          style={StyleSheet.absoluteFill}
        />
        {/* ② Dark sap-green → black → sap-green fill */}
        <LinearGradient
          colors={FILL_COLORS}
          locations={FILL_LOCATIONS}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={StyleSheet.absoluteFill}
        />
        {/* ③ Content */}
        <View style={contentStyle}>{children}</View>
      </View>
    </LinearGradient>
  );
}
