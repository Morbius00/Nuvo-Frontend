import { ReactNode } from 'react';
import { Pressable, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { colors, radii, fontFamily } from '@/theme/tokens';
import { usePressScale } from '@/hooks/usePressScale';

interface ChipProps {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  icon?: ReactNode;
  color?: string;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
const AnimatedView = Animated.View;

export function Chip({ label, selected, onPress, icon, color }: ChipProps) {
  const press = usePressScale({ scaleTo: 0.94 });

  const bgStyle = useAnimatedStyle(() => ({
    backgroundColor: withTiming(selected ? (color ?? colors.primary500) : colors.glassFillStrong, { duration: 180 }),
  }));

  return (
    <AnimatedPressable
      onPress={() => press.onPress(onPress)}
      onPressIn={press.onPressIn}
      onPressOut={press.onPressOut}
      style={press.style}
    >
      <AnimatedView
        style={[
          bgStyle,
          {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 6,
            paddingHorizontal: 14,
            paddingVertical: 9,
            borderRadius: radii.pill,
            borderWidth: 1,
            borderColor: selected ? 'transparent' : colors.glassBorder,
          },
        ]}
      >
        {icon}
        <Text
          style={{
            color: selected ? colors.inkOnPrimary : colors.inkSecondary,
            fontFamily: fontFamily.semibold,
            fontSize: 13,
          }}
        >
          {label}
        </Text>
      </AnimatedView>
    </AnimatedPressable>
  );
}

export function Badge({ label, color = colors.primary500, subtle }: { label: string; color?: string; subtle?: boolean }) {
  return (
    <View
      style={{
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: radii.pill,
        backgroundColor: subtle ? `${color}22` : color,
        alignSelf: 'flex-start',
      }}
    >
      <Text
        style={{
          color: subtle ? color : colors.inkOnPrimary,
          fontFamily: fontFamily.bold,
          fontSize: 11,
        }}
      >
        {label}
      </Text>
    </View>
  );
}
