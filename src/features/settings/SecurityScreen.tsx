import { useState } from 'react';
import { View, Text, Switch, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as LocalAuthentication from 'expo-local-authentication';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { X, Lock } from 'lucide-react-native';
import { Screen } from '@/components/ui/Screen';
import { GlassCard } from '@/components/ui/GlassCard';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { IconButton } from '@/components/ui/IconButton';
import { Input } from '@/components/ui/Input';
import { FingerprintGlyph } from '@/components/ui/icons/BrandGlyphs';
import { colors, fontFamily } from '@/theme/tokens';
import { RootStackParamList } from '@/navigation/types';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { setBiometricEnabled } from '@/store/slices/authSlice';
import { useChangePasswordMutation } from '@/store/api/authApi';

type Nav = NativeStackNavigationProp<RootStackParamList, 'Security'>;

export function SecurityScreen() {
  const navigation = useNavigation<Nav>();
  const dispatch = useAppDispatch();
  const biometricEnabled = useAppSelector((s) => s.auth.biometricEnabled);
  const [changePassword, { isLoading }] = useChangePasswordMutation();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [checkingBiometrics, setCheckingBiometrics] = useState(false);

  const onToggleBiometrics = async (value: boolean) => {
    if (!value) {
      dispatch(setBiometricEnabled(false));
      return;
    }

    setCheckingBiometrics(true);
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      if (!hasHardware || !isEnrolled) {
        Alert.alert(
          'Biometrics not set up',
          'Set up Face ID or Touch ID for this device in your phone Settings, then try again.',
        );
        return;
      }
      const result = await LocalAuthentication.authenticateAsync({ promptMessage: 'Confirm to enable Biometric Lock' });
      if (result.success) dispatch(setBiometricEnabled(true));
    } finally {
      setCheckingBiometrics(false);
    }
  };

  const onChangePassword = async () => {
    if (!currentPassword || !newPassword) return;
    try {
      await changePassword({ currentPassword, newPassword }).unwrap();
      setStatus('success');
      setCurrentPassword('');
      setNewPassword('');
    } catch {
      setStatus('error');
    }
  };

  return (
    <Screen scroll>
      <View style={{ paddingHorizontal: 20, paddingTop: 4, gap: 22 }}>
        <Animated.View
          entering={FadeInDown.springify()}
          style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
        >
          <Text style={{ color: colors.ink, fontFamily: fontFamily.extrabold, fontSize: 22 }}>Security</Text>
          <IconButton variant="glass" size={40} icon={<X size={18} color={colors.ink} />} onPress={() => navigation.goBack()} />
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(60).springify()}>
          <GlassCard>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, padding: 18 }}>
              <View
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 14,
                  backgroundColor: colors.glassFillStrong,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <FingerprintGlyph size={22} color={colors.primary400} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: colors.ink, fontFamily: fontFamily.bold, fontSize: 15 }}>Face ID / Touch ID</Text>
                <Text style={{ color: colors.inkMuted, fontFamily: fontFamily.medium, fontSize: 12, marginTop: 2 }}>
                  Require Face ID or Touch ID to open NUVO
                </Text>
              </View>
              <Switch
                value={biometricEnabled}
                disabled={checkingBiometrics}
                onValueChange={onToggleBiometrics}
                trackColor={{ false: colors.glassFillStrong, true: colors.primary500 }}
                thumbColor="#FFFFFF"
                ios_backgroundColor={colors.glassFillStrong}
              />
            </View>
          </GlassCard>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(120).springify()} style={{ gap: 14 }}>
          <Text style={{ color: colors.inkSecondary, fontFamily: fontFamily.semibold, fontSize: 13, marginLeft: 4 }}>
            Change Password
          </Text>
          <Input
            label="Current Password"
            value={currentPassword}
            onChangeText={setCurrentPassword}
            secureTextEntry
            placeholder="••••••••"
            leftIcon={<Lock size={16} color={colors.inkMuted} />}
          />
          <Input
            label="New Password"
            value={newPassword}
            onChangeText={setNewPassword}
            secureTextEntry
            placeholder="••••••••"
            leftIcon={<Lock size={16} color={colors.inkMuted} />}
          />
          {status === 'success' && (
            <Text style={{ color: colors.primary400, fontFamily: fontFamily.semibold, fontSize: 12.5 }}>
              Password updated successfully.
            </Text>
          )}
          {status === 'error' && (
            <Text style={{ color: colors.danger400, fontFamily: fontFamily.semibold, fontSize: 12.5 }}>
              Couldn’t update your password. Check your current password and try again.
            </Text>
          )}
          <PrimaryButton
            label="Update Password"
            loading={isLoading}
            disabled={!currentPassword || !newPassword}
            onPress={onChangePassword}
          />
        </Animated.View>
      </View>
    </Screen>
  );
}
