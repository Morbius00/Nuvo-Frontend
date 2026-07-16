import { useState } from 'react';
import { View, Text, Pressable, Image } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { User as UserIcon, Mail, Lock, Eye, EyeOff, ArrowLeft } from 'lucide-react-native';
import { Screen } from '@/components/ui/Screen';
import { Input } from '@/components/ui/Input';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { IconButton } from '@/components/ui/IconButton';
import { colors, fontFamily } from '@/theme/tokens';
import { AuthStackParamList } from '@/navigation/types';
import { useRegisterMutation } from '@/store/api';

type Nav = NativeStackNavigationProp<AuthStackParamList>;

const schema = z
  .object({
    name: z.string().min(2, 'Enter your full name'),
    email: z.string().min(1, 'Email is required').email('Enter a valid email'),
    password: z.string().min(6, 'At least 6 characters'),
    confirmPassword: z.string(),
  })
  .refine((v) => v.password === v.confirmPassword, { message: 'Passwords don’t match', path: ['confirmPassword'] });
type FormValues = z.infer<typeof schema>;

export function RegisterScreen() {
  const navigation = useNavigation<Nav>();
  const [showPassword, setShowPassword] = useState(false);
  const [register, { isLoading }] = useRegisterMutation();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { name: '', email: '', password: '', confirmPassword: '' } });

  const onSubmit = async (values: FormValues) => {
    setFormError(null);
    try {
      await register({ name: values.name, email: values.email, password: values.password, currency: 'INR' }).unwrap();
    } catch {
      setFormError('Could not create your account. Please try again.');
    }
  };

  return (
    <Screen scroll>
      <View style={{ paddingHorizontal: 24, paddingTop: 8 }}>
        <IconButton variant="glass" size={42} icon={<ArrowLeft size={19} color={colors.ink} />} onPress={() => navigation.goBack()} />

        <Animated.View entering={FadeInDown.delay(60).springify()} style={{ alignItems: 'center', marginTop: 24, marginBottom: 4 }}>
          <Image
            source={require('../../../assets/Nuvo-Logo-3d.png')}
            style={{ width: 120, height: 120, resizeMode: 'contain' }}
          />
        </Animated.View>

        <Animated.View entering={FadeInDown.springify()} style={{ marginTop: 8 }}>
          <Text style={{ color: colors.ink, fontFamily: fontFamily.extrabold, fontSize: 28 }}>Create your account</Text>
          <Text style={{ color: colors.inkSecondary, fontFamily: fontFamily.medium, fontSize: 14, marginTop: 6 }}>
            Zero-effort finance starts here
          </Text>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(100).springify()} style={{ marginTop: 32, gap: 18 }}>
          <Controller
            control={control}
            name="name"
            render={({ field: { value, onChange, onBlur } }) => (
              <Input
                label="Full name"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                placeholder="Raj Saha"
                leftIcon={<UserIcon size={18} color={colors.inkMuted} />}
                error={errors.name?.message}
              />
            )}
          />
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
                placeholder="At least 6 characters"
                leftIcon={<Lock size={18} color={colors.inkMuted} />}
                rightIcon={
                  <Pressable onPress={() => setShowPassword((s) => !s)} hitSlop={10}>
                    {showPassword ? <EyeOff size={18} color={colors.inkMuted} /> : <Eye size={18} color={colors.inkMuted} />}
                  </Pressable>
                }
                error={errors.password?.message}
              />
            )}
          />
          <Controller
            control={control}
            name="confirmPassword"
            render={({ field: { value, onChange, onBlur } }) => (
              <Input
                label="Confirm password"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                secureTextEntry={!showPassword}
                placeholder="Re-enter password"
                leftIcon={<Lock size={18} color={colors.inkMuted} />}
                error={errors.confirmPassword?.message}
              />
            )}
          />

          {formError && (
            <Text style={{ color: colors.danger500, fontFamily: fontFamily.medium, fontSize: 13, textAlign: 'center' }}>
              {formError}
            </Text>
          )}

          <PrimaryButton label="Create Account" loading={isLoading} onPress={handleSubmit(onSubmit)} />

          <Text style={{ color: colors.inkMuted, fontFamily: fontFamily.medium, fontSize: 12, textAlign: 'center', lineHeight: 18 }}>
            By continuing you agree to NUVO’s Terms of Service and Privacy Policy.
          </Text>
        </Animated.View>

        <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: 24 }}>
          <Text style={{ color: colors.inkMuted, fontFamily: fontFamily.medium, fontSize: 13 }}>Already have an account?</Text>
          <Pressable onPress={() => navigation.navigate('Login')}>
            <Text style={{ color: colors.primary400, fontFamily: fontFamily.bold, fontSize: 13 }}>Sign in</Text>
          </Pressable>
        </View>
      </View>
    </Screen>
  );
}
