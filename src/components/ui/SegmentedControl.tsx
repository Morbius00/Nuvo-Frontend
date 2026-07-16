import { useState, useEffect } from 'react';
import { Pressable, Text, View, LayoutChangeEvent } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { colors, radii, fontFamily } from '@/theme/tokens';

interface SegmentedControlProps {
  options: string[];
  value: string;
  onChange: (value: string) => void;
}

export function SegmentedControl({ options, value, onChange }: SegmentedControlProps) {
  const [width, setWidth] = useState(0);
  const segmentWidth = width / options.length;
  const translateX = useSharedValue(0);
  const activeIndex = Math.max(0, options.indexOf(value));

  useEffect(() => {
    if (width > 0) {
      translateX.value = withSpring(activeIndex * segmentWidth, { damping: 18, stiffness: 220 });
    }
  }, [activeIndex, segmentWidth, width, translateX]);

  const thumbStyle = useAnimatedStyle(() => ({ transform: [{ translateX: translateX.value }] }));

  const onLayout = (e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width);

  return (
    <View
      onLayout={onLayout}
      style={{
        flexDirection: 'row',
        backgroundColor: colors.glassFillStrong,
        borderRadius: radii.pill,
        borderWidth: 1,
        borderColor: colors.glassBorder,
        padding: 4,
        height: 46,
        position: 'relative',
      }}
    >
      {width > 0 && (
        <Animated.View
          style={[
            thumbStyle,
            {
              position: 'absolute',
              top: 4,
              bottom: 4,
              left: 4,
              width: segmentWidth - 8,
              borderRadius: radii.pill,
              backgroundColor: colors.primary500,
            },
          ]}
        />
      )}
      {options.map((option) => (
        <Pressable key={option} onPress={() => onChange(option)} style={{ flex: 1, paddingVertical: 9 }}>
          <Text
            style={{
              textAlign: 'center',
              color: option === value ? colors.inkOnPrimary : colors.inkSecondary,
              fontFamily: fontFamily.semibold,
              fontSize: 13,
            }}
          >
            {option}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}
