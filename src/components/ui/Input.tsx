import { ReactNode, forwardRef, useState } from 'react';
import { TextInput, TextInputProps, View, Text } from 'react-native';
import { colors, radii, fontFamily } from '@/theme/tokens';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

export const Input = forwardRef<TextInput, InputProps>(
  ({ label, error, leftIcon, rightIcon, style, onFocus, onBlur, ...props }, ref) => {
    const [focused, setFocused] = useState(false);

    return (
      <View style={{ gap: 8 }}>
        {label && (
          <Text style={{ color: colors.inkSecondary, fontFamily: fontFamily.semibold, fontSize: 13 }}>{label}</Text>
        )}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 10,
            height: 54,
            paddingHorizontal: 16,
            borderRadius: radii.lg,
            backgroundColor: colors.glassFillStrong,
            borderWidth: 1.5,
            borderColor: error ? colors.danger500 : focused ? colors.primary500 : colors.glassBorder,
          }}
        >
          {leftIcon}
          <TextInput
            ref={ref}
            placeholderTextColor={colors.inkMuted}
            style={[
              { flex: 1, color: colors.ink, fontFamily: fontFamily.semibold, fontSize: 15, height: '100%' },
              style,
            ]}
            onFocus={(e) => {
              setFocused(true);
              onFocus?.(e);
            }}
            onBlur={(e) => {
              setFocused(false);
              onBlur?.(e);
            }}
            {...props}
          />
          {rightIcon}
        </View>
        {error && <Text style={{ color: colors.danger500, fontFamily: fontFamily.medium, fontSize: 12 }}>{error}</Text>}
      </View>
    );
  },
);
Input.displayName = 'Input';
