import { useState } from 'react';
import { View, Text, Pressable, Image } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { Mail, Lock, Eye, EyeOff, ArrowLeft } from 'lucide-react-native';
import { Screen } from '@/components/ui/Screen';
import { Input } from '@/components/ui/Input';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { GlassButton } from '@/components/ui/GlassButton';
import { IconButton } from '@/components/ui/IconButton';
import { GoogleGlyph, AppleGlyph } from '@/components/ui/icons/BrandGlyphs';
import { colors, fontFamily } from '@/theme/tokens';
import { AuthStackParamList } from '@/navigation/types';
import { useLoginMutation, useGoogleAuthMutation } from '@/store/api';
import { useGoogleSignIn } from './useGoogleSignIn';
import { useDeviceIdentity } from '@/hooks/useDeviceIdentity';
import { useAppDispatch } from '@/store/hooks';
import { showToast } from '@/store/slices/toastSlice';

type Nav = NativeStackNavigationProp<AuthStackParamList>;

const schema = z.object({
  email: z.string().min(1, 'Email is required').email('Enter a valid email'),
  password: z.string().min(6, 'At least 6 characters'),
});
type FormValues = z.infer<typeof schema>;

export function LoginScreen() {
  const navigation = useNavigation<Nav>();
  const dispatch = useAppDispatch();
  const [showPassword, setShowPassword] = useState(false);
  const [login, { isLoading }] = useLoginMutation();
  const [googleAuth, { isLoading: isGoogleLoading }] = useGoogleAuthMutation();
  const { signIn: signInWithGoogle } = useGoogleSignIn();
  const { deviceId, deviceName } = useDeviceIdentity();
  const [formError, setFormError] = useState<string | null>(null);
  const isMockMode = process.env.EXPO_PUBLIC_API_MODE !== 'live';

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = async (values: FormValues) => {
    setFormError(null);
    try {
      await login({ email: values.email, password: values.password, deviceId: deviceId ?? undefined, deviceName }).unwrap();
    } catch {
      setFormError('Could not sign in. Check your details and try again.');
    }
  };

  const onGoogleSignIn = async () => {
    if (isGoogleLoading) return;
    setFormError(null);
    try {
      // Mock mode has no real Google credentials configured — skip the OAuth prompt entirely.
      const idToken = isMockMode ? 'mock_google_id_token' : await signInWithGoogle();
      await googleAuth({ idToken, deviceId: deviceId ?? undefined, deviceName }).unwrap();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Could not sign in with Google.');
    }
  };

  const onApplePress = () => {
    dispatch(showToast({ variant: 'info', message: 'Apple Sign-In is coming soon.' }));
  };

  return (
    <Screen scroll>
      <View style={{ paddingHorizontal: 24, paddingTop: 8 }}>
        <IconButton
          variant="glass"
          size={42}
          icon={<ArrowLeft size={19} color={colors.ink} />}
          onPress={() => navigation.goBack()}
        />

        <Animated.View entering={FadeInDown.delay(60).springify()} style={{ alignItems: 'center', marginTop: 24, marginBottom: 4 }}>
          <Image
            source={require('../../../assets/Nuvo-Logo-3d.png')}
            style={{ width: 120, height: 120, resizeMode: 'contain' }}
          />
        </Animated.View>

        <Animated.View entering={FadeInDown.springify()} style={{ marginTop: 8 }}>
          <Text style={{ color: colors.ink, fontFamily: fontFamily.extrabold, fontSize: 28 }}>Welcome back</Text>
          <Text style={{ color: colors.inkSecondary, fontFamily: fontFamily.medium, fontSize: 14, marginTop: 6 }}>
            Sign in to continue to NUVO
          </Text>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(100).springify()} style={{ marginTop: 32, gap: 18 }}>
          <Controller
            control={control}
            name="email"
            render={({ field: { value, onChange, onBlur } }) => (
              <Input
                label="Email"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                autoCapitalize="none"
                keyboardType="email-address"
                placeholder="you@email.com"
                leftIcon={<Mail size={18} color={colors.inkMuted} />}
                error={errors.email?.message}
              />
            )}
          />
          <Controller
            control={control}
            name="password"
            render={({ field: { value, onChange, onBlur } }) => (
              <Input
                label="Password"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                secureTextEntry={!showPassword}
                placeholder="••••••••"
                leftIcon={<Lock size={18} color={colors.inkMuted} />}
                rightIcon={
                  <Pressable onPress={() => setShowPassword((s) => !s)} hitSlop={10}>
                    {showPassword ? (
                      <EyeOff size={18} color={colors.inkMuted} />
                    ) : (
                      <Eye size={18} color={colors.inkMuted} />
                    )}
                  </Pressable>
                }
                error={errors.password?.message}
              />
            )}
          />

          <Pressable style={{ alignSelf: 'flex-end' }} onPress={() => navigation.navigate('ForgotPassword')}>
            <Text style={{ color: colors.primary400, fontFamily: fontFamily.semibold, fontSize: 13 }}>
              Forgot password?
            </Text>
          </Pressable>

          {formError && (
            <Text style={{ color: colors.danger500, fontFamily: fontFamily.medium, fontSize: 13, textAlign: 'center' }}>
              {formError}
            </Text>
          )}

          <PrimaryButton label="Sign In" loading={isLoading} onPress={handleSubmit(onSubmit)} />

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginVertical: 4 }}>
            <View style={{ flex: 1, height: 1, backgroundColor: colors.hairline }} />
            <Text style={{ color: colors.inkMuted, fontFamily: fontFamily.medium, fontSize: 12 }}>or continue with</Text>
            <View style={{ flex: 1, height: 1, backgroundColor: colors.hairline }} />
          </View>

          <View style={{ flexDirection: 'row', gap: 12 }}>
            <View style={{ flex: 1 }}>
              <GlassButton
                label={isGoogleLoading ? 'Signing in…' : 'Google'}
                icon={<GoogleGlyph size={18} />}
                onPress={onGoogleSignIn}
              />
            </View>
            <View style={{ flex: 1 }}>
              <GlassButton label="Apple" icon={<AppleGlyph size={16} />} onPress={onApplePress} style={{ opacity: 0.5 }} />
            </View>
          </View>
        </Animated.View>

        <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: 28 }}>
          <Text style={{ color: colors.inkMuted, fontFamily: fontFamily.medium, fontSize: 13 }}>Don’t have an account?</Text>
          <Pressable onPress={() => navigation.navigate('Register')}>
            <Text style={{ color: colors.primary400, fontFamily: fontFamily.bold, fontSize: 13 }}>Sign up</Text>
          </Pressable>
        </View>
      </View>
    </Screen>
  );
}
