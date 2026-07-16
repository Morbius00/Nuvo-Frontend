import { View, Text } from 'react-native';
import Animated, { FadeInDown, FadeInUp, ZoomIn } from 'react-native-reanimated';
import { Screen } from '@/components/ui/Screen';
import { GlassCard } from '@/components/ui/GlassCard';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { FingerprintGlyph } from '@/components/ui/icons/BrandGlyphs';
import { colors, fontFamily } from '@/theme/tokens';
import { useAppDispatch } from '@/store/hooks';
import { completeOnboarding, setBiometricEnabled } from '@/store/slices/authSlice';

export function BiometricSetupScreen() {
  const dispatch = useAppDispatch();

  const finish = (enabled: boolean) => {
    dispatch(setBiometricEnabled(enabled));
    dispatch(completeOnboarding());
  };

  return (
    <Screen>
      <View style={{ flex: 1, paddingHorizontal: 28, alignItems: 'center', justifyContent: 'center', gap: 28 }}>
        <Animated.View entering={ZoomIn.springify().delay(80)}>
          <GlassCard radius={999} style={{ width: 132, height: 132 }} glow={colors.primary500}>
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
              <FingerprintGlyph size={56} />
            </View>
          </GlassCard>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(200).springify()} style={{ alignItems: 'center', gap: 10 }}>
          <Text style={{ color: colors.ink, fontFamily: fontFamily.extrabold, fontSize: 24, textAlign: 'center' }}>
            Secure NUVO with Face ID
          </Text>
          <Text
            style={{
              color: colors.inkSecondary,
              fontFamily: fontFamily.medium,
              fontSize: 14,
              textAlign: 'center',
              lineHeight: 21,
              maxWidth: 300,
            }}
          >
            Unlock the app and approve large transactions instantly — your biometric data never leaves this device.
          </Text>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(320).springify()} style={{ width: '100%', gap: 12, marginTop: 8 }}>
          <PrimaryButton label="Enable Face ID" onPress={() => finish(true)} />
          <Text
            onPress={() => finish(false)}
            style={{ color: colors.inkMuted, fontFamily: fontFamily.semibold, fontSize: 14, textAlign: 'center', paddingVertical: 8 }}
          >
            Skip for now
          </Text>
        </Animated.View>
      </View>
    </Screen>
  );
}
