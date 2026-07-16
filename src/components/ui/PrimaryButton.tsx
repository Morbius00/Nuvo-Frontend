import { ReactNode } from 'react';
import { Pressable, Text, ActivityIndicator, ViewStyle, StyleProp } from 'react-native';
import Animated from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { primaryGradient, colors, radii, shadow, fontFamily } from '@/theme/tokens';
import { usePressScale } from '@/hooks/usePressScale';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface PrimaryButtonProps {
  label: string;
  onPress?: () => void;
  loading?: boolean;
  disabled?: boolean;
  icon?: ReactNode;
  size?: 'md' | 'lg';
  style?: StyleProp<ViewStyle>;
  fullWidth?: boolean;
}

export function PrimaryButton({
  label,
  onPress,
  loading,
  disabled,
  icon,
  size = 'lg',
  style,
  fullWidth = true,
}: PrimaryButtonProps) {
  const press = usePressScale();
  const isDisabled = disabled || loading;
  const height = size === 'lg' ? 58 : 48;

  return (
    <AnimatedPressable
      disabled={isDisabled}
      onPress={() => press.onPress(onPress)}
      onPressIn={press.onPressIn}
      onPressOut={press.onPressOut}
      style={[press.style, { width: fullWidth ? '100%' : undefined, opacity: isDisabled ? 0.55 : 1 }, style]}
    >
      <LinearGradient
        colors={primaryGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          height,
          borderRadius: radii.pill,
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'row',
          gap: 8,
          ...shadow.glow(colors.primary500),
        }}
      >
        {loading ? (
          <ActivityIndicator color={colors.inkOnPrimary} />
        ) : (
          <>
            {icon}
            <Text
              style={{
                color: colors.inkOnPrimary,
                fontFamily: fontFamily.bold,
                fontSize: size === 'lg' ? 16 : 15,
                letterSpacing: 0.2,
              }}
            >
              {label}
            </Text>
          </>
        )}
      </LinearGradient>
    </AnimatedPressable>
  );
}
