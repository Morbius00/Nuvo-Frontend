import { useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { Mail, Lock, Eye, EyeOff, ArrowLeft, KeyRound } from 'lucide-react-native';
import { Screen } from '@/components/ui/Screen';
import { Input } from '@/components/ui/Input';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { IconButton } from '@/components/ui/IconButton';
import { colors, fontFamily } from '@/theme/tokens';
import { AuthStackParamList } from '@/navigation/types';
import { useForgotPasswordMutation, useResetPasswordMutation } from '@/store/api';

type Nav = NativeStackNavigationProp<AuthStackParamList>;

const emailSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Enter a valid email'),
});
type EmailValues = z.infer<typeof emailSchema>;

const resetSchema = z
  .object({
    otp: z.string().length(4, 'Enter the 4-digit code'),
    newPassword: z.string().min(8, 'At least 8 characters'),
    confirmPassword: z.string(),
  })
  .refine((v) => v.newPassword === v.confirmPassword, { message: 'Passwords don’t match', path: ['confirmPassword'] });
type ResetValues = z.infer<typeof resetSchema>;

export function ForgotPasswordScreen() {
  const navigation = useNavigation<Nav>();
  const [step, setStep] = useState<'email' | 'reset' | 'done'>('email');
  const [email, setEmail] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [forgotPassword, { isLoading: isSendingOtp }] = useForgotPasswordMutation();
  const [resetPassword, { isLoading: isResetting }] = useResetPasswordMutation();

  const emailForm = useForm<EmailValues>({ resolver: zodResolver(emailSchema), defaultValues: { email: '' } });
  const resetForm = useForm<ResetValues>({
    resolver: zodResolver(resetSchema),
    defaultValues: { otp: '', newPassword: '', confirmPassword: '' },
  });

  const onSendCode = async (values: EmailValues) => {
    setFormError(null);
    try {
      await forgotPassword({ email: values.email }).unwrap();
      setEmail(values.email);
      setStep('reset');
    } catch {
      setFormError('Could not send the code. Check your email and try again.');
    }
  };

  const onResendCode = async () => {
    setFormError(null);
    try {
      await forgotPassword({ email }).unwrap();
    } catch {
      setFormError('Could not resend the code. Try again in a moment.');
    }
  };

  const onResetPassword = async (values: ResetValues) => {
    setFormError(null);
    try {
      await resetPassword({ email, otp: values.otp, newPassword: values.newPassword }).unwrap();
      setStep('done');
    } catch {
      setFormError('That code is incorrect or expired. Check the email and try again.');
    }
  };

  return (
    <Screen scroll>
      <View style={{ paddingHorizontal: 24, paddingTop: 8 }}>
        <IconButton
          variant="glass"
          size={42}
          icon={<ArrowLeft size={19} color={colors.ink} />}
          onPress={() => (step === 'email' ? navigation.goBack() : setStep('email'))}
        />

        {step === 'email' && (
          <>
            <Animated.View entering={FadeInDown.springify()} style={{ marginTop: 24 }}>
              <Text style={{ color: colors.ink, fontFamily: fontFamily.extrabold, fontSize: 26 }}>Forgot password?</Text>
              <Text style={{ color: colors.inkSecondary, fontFamily: fontFamily.medium, fontSize: 14, marginTop: 6 }}>
                Enter your email and we’ll send you a 4-digit code to reset it.
              </Text>
            </Animated.View>

            <Animated.View entering={FadeInUp.delay(100).springify()} style={{ marginTop: 28, gap: 18 }}>
              <Controller
                control={emailForm.control}
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
                    error={emailForm.formState.errors.email?.message}
                  />
                )}
              />

              {formError && (
                <Text style={{ color: colors.danger500, fontFamily: fontFamily.medium, fontSize: 13, textAlign: 'center' }}>
                  {formError}
                </Text>
              )}

              <PrimaryButton label="Send Code" loading={isSendingOtp} onPress={emailForm.handleSubmit(onSendCode)} />
            </Animated.View>
          </>
        )}

        {step === 'reset' && (
          <>
            <Animated.View entering={FadeInDown.springify()} style={{ marginTop: 24 }}>
              <Text style={{ color: colors.ink, fontFamily: fontFamily.extrabold, fontSize: 26 }}>Enter the code</Text>
              <Text style={{ color: colors.inkSecondary, fontFamily: fontFamily.medium, fontSize: 14, marginTop: 6 }}>
                We sent a 4-digit code to {email}.
              </Text>
            </Animated.View>

            <Animated.View entering={FadeInUp.delay(100).springify()} style={{ marginTop: 28, gap: 18 }}>
              <Controller
                control={resetForm.control}
                name="otp"
                render={({ field: { value, onChange } }) => (
                  <Input
                    label="4-digit code"
                    value={value}
                    onChangeText={(t) => onChange(t.replace(/[^0-9]/g, '').slice(0, 4))}
                    keyboardType="number-pad"
                    maxLength={4}
                    placeholder="0000"
                    leftIcon={<KeyRound size={18} color={colors.inkMuted} />}
                    error={resetForm.formState.errors.otp?.message}
                  />
                )}
              />
              <Controller
                control={resetForm.control}
                name="newPassword"
                render={({ field: { value, onChange, onBlur } }) => (
                  <Input
                    label="New password"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    secureTextEntry={!showPassword}
                    placeholder="At least 8 characters"
                    leftIcon={<Lock size={18} color={colors.inkMuted} />}
                    rightIcon={
                      <Pressable onPress={() => setShowPassword((s) => !s)} hitSlop={10}>
                        {showPassword ? <EyeOff size={18} color={colors.inkMuted} /> : <Eye size={18} color={colors.inkMuted} />}
                      </Pressable>
                    }
                    error={resetForm.formState.errors.newPassword?.message}
                  />
                )}
              />
              <Controller
                control={resetForm.control}
                name="confirmPassword"
                render={({ field: { value, onChange, onBlur } }) => (
                  <Input
                    label="Confirm password"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    secureTextEntry={!showPassword}
                    placeholder="Re-enter new password"
                    leftIcon={<Lock size={18} color={colors.inkMuted} />}
                    error={resetForm.formState.errors.confirmPassword?.message}
                  />
                )}
              />

              {formError && (
                <Text style={{ color: colors.danger500, fontFamily: fontFamily.medium, fontSize: 13, textAlign: 'center' }}>
                  {formError}
                </Text>
              )}

              <PrimaryButton label="Reset Password" loading={isResetting} onPress={resetForm.handleSubmit(onResetPassword)} />

              <Pressable onPress={onResendCode} style={{ alignSelf: 'center', paddingVertical: 8 }}>
                <Text style={{ color: colors.primary400, fontFamily: fontFamily.semibold, fontSize: 13 }}>
                  Didn’t get a code? Resend
                </Text>
              </Pressable>
            </Animated.View>
          </>
        )}

        {step === 'done' && (
          <Animated.View entering={FadeInDown.springify()} style={{ marginTop: 60, alignItems: 'center', gap: 10 }}>
            <Text style={{ color: colors.ink, fontFamily: fontFamily.extrabold, fontSize: 24, textAlign: 'center' }}>
              Password reset
            </Text>
            <Text style={{ color: colors.inkSecondary, fontFamily: fontFamily.medium, fontSize: 14, textAlign: 'center' }}>
              Your password has been changed. Sign in with your new password.
            </Text>
            <PrimaryButton
              label="Back to Sign In"
              onPress={() => navigation.reset({ index: 0, routes: [{ name: 'Login' }] })}
              style={{ marginTop: 16, width: 220 }}
              fullWidth={false}
            />
          </Animated.View>
        )}
      </View>
    </Screen>
  );
}
