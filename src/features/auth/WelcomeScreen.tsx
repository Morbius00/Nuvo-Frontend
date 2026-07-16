import { useState, useEffect, useRef } from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  FadeIn,
  FadeInUp,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import { ShieldCheck } from 'lucide-react-native';
import { Screen } from '@/components/ui/Screen';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { GlassButton } from '@/components/ui/GlassButton';
import { colors, fontFamily } from '@/theme/tokens';
import { AuthStackParamList } from '@/navigation/types';

type Nav = NativeStackNavigationProp<AuthStackParamList>;

// Timeline:
//   0 ms  — logo bounces in
//   3000ms — headline dissolves in (800ms fade)
//   3900ms — description starts typing (42ms/char)
//   ~8000ms — badge + buttons appear

const HEADLINE = 'Financial clarity,\nzero effort.';
const DESCRIPTION =
  'LUNA scans your receipts, guards your budget, and tells you exactly where your money goes — automatically.';
const HEADLINE_APPEAR_AT = 2000;
const HEADLINE_FADE_DURATION = 800;
const TYPING_START_AT = HEADLINE_APPEAR_AT + HEADLINE_FADE_DURATION + 200;
const TYPING_SPEED = 42;

function useTypingEffect(text: string, speed: number, startAt: number) {
  const [displayed, setDisplayed] = useState('');
  const [started, setStarted] = useState(false);
  const [done, setDone] = useState(false);
  const indexRef = useRef(0);

  useEffect(() => {
    const startTimer = setTimeout(() => {
      setStarted(true);
      const tick = () => {
        if (indexRef.current < text.length) {
          indexRef.current += 1;
          setDisplayed(text.slice(0, indexRef.current));
          setTimeout(tick, speed);
        } else {
          setDone(true);
        }
      };
      tick();
    }, startAt);
    return () => clearTimeout(startTimer);
  }, [text, speed, startAt]);

  return { displayed, started, done };
}

export function WelcomeScreen() {
  const navigation = useNavigation<Nav>();
  const { displayed: typedDesc, done: typingDone } = useTypingEffect(
    DESCRIPTION,
    TYPING_SPEED,
    TYPING_START_AT,
  );

  // ── Logo animations ──────────────────────────────────────────────
  const logoScale = useSharedValue(0.15);
  const logoY = useSharedValue(0);

  // ── Headline dissolve ────────────────────────────────────────────
  const headlineOpacity = useSharedValue(0);
  const headlineY = useSharedValue(18);

  // ── Aurora blobs ─────────────────────────────────────────────────
  const aurora1 = useSharedValue(0.5);
  const aurora2 = useSharedValue(0.25);

  useEffect(() => {
    // Logo: springy bounce-in
    logoScale.value = withDelay(
      200,
      withTiming(1, { duration: 780, easing: Easing.out(Easing.back(1.7)) }),
    );
    // Logo: gentle infinite float (starts after 3 sec hold)
    logoY.value = withDelay(
      1000,
      withRepeat(
        withSequence(
          withTiming(-10, { duration: 2300, easing: Easing.inOut(Easing.sin) }),
          withTiming(0, { duration: 2300, easing: Easing.inOut(Easing.sin) }),
        ),
        -1,
        true,
      ),
    );

    // Headline: dissolve in after 3 sec hold
    headlineOpacity.value = withDelay(
      HEADLINE_APPEAR_AT,
      withTiming(1, { duration: HEADLINE_FADE_DURATION, easing: Easing.out(Easing.ease) }),
    );
    headlineY.value = withDelay(
      HEADLINE_APPEAR_AT,
      withTiming(0, { duration: HEADLINE_FADE_DURATION, easing: Easing.out(Easing.ease) }),
    );

    // Aurora blobs: breathing pulse
    aurora1.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 2800, easing: Easing.inOut(Easing.sin) }),
        withTiming(0.3, { duration: 2800, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      true,
    );
    aurora2.value = withDelay(
      1400,
      withRepeat(
        withSequence(
          withTiming(0.9, { duration: 3200, easing: Easing.inOut(Easing.sin) }),
          withTiming(0.15, { duration: 3200, easing: Easing.inOut(Easing.sin) }),
        ),
        -1,
        true,
      ),
    );
  }, []);

  const logoStyle = useAnimatedStyle(() => ({
    transform: [{ scale: logoScale.value }, { translateY: logoY.value }],
  }));
  const headlineStyle = useAnimatedStyle(() => ({
    opacity: headlineOpacity.value,
    transform: [{ translateY: headlineY.value }],
  }));
  const blob1Style = useAnimatedStyle(() => ({ opacity: aurora1.value }));
  const blob2Style = useAnimatedStyle(() => ({ opacity: aurora2.value }));

  return (
    <Screen edges={['top', 'bottom', 'left', 'right']} aurora={false}>
      {/* ── Animated aurora splash ──────────────────────────── */}
      <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, blob1Style]}>
        <LinearGradient
          colors={['rgba(34,227,122,0.55)', 'rgba(34,227,122,0)']}
          style={styles.blob1}
        />
      </Animated.View>
      <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, blob2Style]}>
        <LinearGradient
          colors={['rgba(182,255,77,0.36)', 'rgba(182,255,77,0)']}
          style={styles.blob2}
        />
      </Animated.View>
      <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, blob1Style]}>
        <LinearGradient
          colors={['rgba(34,227,122,0.18)', 'rgba(34,227,122,0)']}
          style={styles.blob3}
        />
      </Animated.View>

      <View style={{ flex: 1, paddingHorizontal: 28, justifyContent: 'space-between', paddingBottom: 16 }}>
        {/* ── Hero ─────────────────────────────────────────── */}
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          {/* 3D Logo — centred, holds for 3 sec before anything else */}
          <Animated.View style={[{ marginBottom: 40 }, logoStyle]}>
            <Image
              source={require('../../../assets/Nuvo-Logo-3d.png')}
              style={{ width: 180, height: 180, resizeMode: 'contain' }}
            />
          </Animated.View>

          {/* Headline — dissolves in at 3 s */}
          <Animated.View style={[{ width: '100%' }, headlineStyle]}>
            <Text
              style={{
                color: colors.ink,
                fontFamily: fontFamily.extrabold,
                fontSize: 36,
                lineHeight: 44,
                textAlign: 'center',
              }}
            >
              {HEADLINE}
            </Text>
          </Animated.View>

          {/* Description — typing effect, starts after headline fades in */}
          <View style={{ width: '100%', marginTop: 14, minHeight: 72 }}>
            <Text
              style={{
                color: colors.inkSecondary,
                fontFamily: fontFamily.medium,
                fontSize: 15,
                lineHeight: 23,
                textAlign: 'center',
              }}
            >
              {typedDesc}
              {typedDesc.length > 0 && !typingDone && (
                <Text style={{ color: colors.primary400, fontFamily: fontFamily.bold }}>|</Text>
              )}
            </Text>
          </View>

          {/* Badge */}
          {typingDone && (
            <Animated.View
              entering={FadeInUp.delay(200).springify()}
              style={{ width: '100%', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 6 }}
            >
              <ShieldCheck size={15} color={colors.primary400} />
              <Text style={{ color: colors.inkMuted, fontFamily: fontFamily.medium, fontSize: 12 }}>
                Bank-grade encryption
              </Text>
            </Animated.View>
          )}
        </View>

        {/* ── CTA buttons ──────────────────────────────────── */}
        {typingDone && (
          <Animated.View entering={FadeIn.delay(400).duration(500)} style={{ gap: 12 }}>
            <PrimaryButton label="Get Started" onPress={() => navigation.navigate('Register')} />
            <GlassButton label="I already have an account" onPress={() => navigation.navigate('Login')} />
          </Animated.View>
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  blob1: {
    position: 'absolute',
    top: -200,
    left: -130,
    width: 440,
    height: 440,
    borderRadius: 999,
  },
  blob2: {
    position: 'absolute',
    bottom: 80,
    right: -150,
    width: 400,
    height: 400,
    borderRadius: 999,
  },
  blob3: {
    position: 'absolute',
    top: '45%',
    left: -80,
    width: 300,
    height: 300,
    borderRadius: 999,
  },
});
