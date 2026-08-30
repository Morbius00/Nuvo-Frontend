import { useEffect, useState } from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  FadeIn,
  SharedValue,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  interpolate,
  interpolateColor,
  Easing,
} from 'react-native-reanimated';
import { Sparkles } from 'lucide-react-native';
import { colors, fontFamily, bgAuroraGreen, bgAuroraLime, bgAuroraLocations } from '@/theme/tokens';

const TAGLINES = ['Waking up your financial intelligence…', 'Reviewing your latest transactions…', 'Almost ready…'];

const HOLD_DURATION = 1900;
const TAGLINE_INTERVAL = 750;
const EXIT_DURATION = 380;

function Dot({ progress, index }: { progress: SharedValue<number>; index: number }) {
  const style = useAnimatedStyle(() => {
    const t = (progress.value - index * 0.18 + 1) % 1;
    return { opacity: interpolate(t, [0, 0.5, 1], [0.25, 1, 0.25]) };
  });
  return <Animated.View style={[{ width: 6, height: 6, borderRadius: 3, backgroundColor: colors.primary400 }, style]} />;
}

function LoadingDots({ progress }: { progress: SharedValue<number> }) {
  return (
    <View style={{ flexDirection: 'row', gap: 6 }}>
      {[0, 1, 2].map((i) => (
        <Dot key={i} progress={progress} index={i} />
      ))}
    </View>
  );
}

interface LunaSplashProps {
  onFinish: () => void;
}

export function LunaSplash({ onFinish }: LunaSplashProps) {
  const [taglineIndex, setTaglineIndex] = useState(0);

  const float = useSharedValue(0);
  const glow = useSharedValue(0);
  const dots = useSharedValue(0);
  const exitProgress = useSharedValue(0);
  const sparkleSpin = useSharedValue(0);

  useEffect(() => {
    float.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: 1500, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      false,
    );
    glow.value = withRepeat(withSequence(withTiming(1, { duration: 1100 }), withTiming(0, { duration: 1100 })), -1, true);
    dots.value = withRepeat(withTiming(1, { duration: 1200, easing: Easing.linear }), -1, false);
    sparkleSpin.value = withRepeat(withTiming(1, { duration: 2600, easing: Easing.linear }), -1, false);
  }, []);

  useEffect(() => {
    const taglineTimer = setInterval(() => {
      setTaglineIndex((i) => (i + 1) % TAGLINES.length);
    }, TAGLINE_INTERVAL);

    let finishTimer: ReturnType<typeof setTimeout> | undefined;
    const exitTimer = setTimeout(() => {
      exitProgress.value = withTiming(1, { duration: EXIT_DURATION, easing: Easing.in(Easing.cubic) });
      finishTimer = setTimeout(onFinish, EXIT_DURATION);
    }, HOLD_DURATION);

    return () => {
      clearInterval(taglineTimer);
      clearTimeout(exitTimer);
      clearTimeout(finishTimer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const containerStyle = useAnimatedStyle(() => ({
    opacity: 1 - exitProgress.value,
    transform: [{ scale: 1 + exitProgress.value * 0.06 }],
  }));

  const heroStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: interpolate(float.value, [0, 1], [-10, 10]) }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: interpolate(glow.value, [0, 1], [0.45, 0.85]),
    transform: [{ scale: interpolate(glow.value, [0, 1], [0.92, 1.12]) }],
  }));

  const wordmarkStyle = useAnimatedStyle(() => ({
    color: interpolateColor(glow.value, [0, 1], [colors.ink, colors.primary200]),
  }));

  const sparkleStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${interpolate(sparkleSpin.value, [0, 1], [0, 360])}deg` }],
    opacity: interpolate(glow.value, [0, 1], [0.5, 1]),
  }));

  return (
    <Animated.View
      entering={FadeIn.duration(220)}
      style={[StyleSheet.absoluteFill, containerStyle, { backgroundColor: colors.bg, zIndex: 50, elevation: 50 }]}
      pointerEvents="auto"
    >
      <View pointerEvents="none" style={StyleSheet.absoluteFill}>
        <LinearGradient
          colors={bgAuroraGreen}
          locations={bgAuroraLocations}
          style={{ position: 'absolute', top: -140, left: -120, width: 420, height: 420, borderRadius: 999 }}
        />
        <LinearGradient
          colors={bgAuroraLime}
          locations={bgAuroraLocations}
          style={{ position: 'absolute', bottom: -160, right: -130, width: 380, height: 380, borderRadius: 999 }}
        />
      </View>

      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 }}>
        <View style={{ width: 260, height: 260, alignItems: 'center', justifyContent: 'center' }}>
          <Animated.View
            pointerEvents="none"
            style={[
              glowStyle,
              {
                position: 'absolute',
                width: 200,
                height: 200,
                borderRadius: 100,
                backgroundColor: colors.primary500,
                opacity: 0.5,
              },
            ]}
          />
          <Animated.View style={heroStyle}>
            <Image
              source={require('../../../assets/LUNA_Hero.png')}
              style={{ width: 260, height: 260 }}
              resizeMode="contain"
            />
          </Animated.View>
          <Animated.View style={[sparkleStyle, { position: 'absolute', top: 14, right: 30 }]}>
            <Sparkles size={22} color={colors.primary300} />
          </Animated.View>
        </View>

        <Animated.View entering={FadeIn.delay(260).duration(420)} style={{ alignItems: 'center', marginTop: 4 }}>
          <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 8 }}>
            <Animated.Text style={[wordmarkStyle, { fontFamily: fontFamily.extrabold, fontSize: 34, letterSpacing: 1 }]}>
              LUNA
            </Animated.Text>
          </View>
          <Text
            style={{
              color: colors.inkMuted,
              fontFamily: fontFamily.medium,
              fontSize: 12.5,
              marginTop: 2,
              letterSpacing: 0.4,
            }}
          >
            YOUR AI FINANCIAL ADVISOR
          </Text>
        </Animated.View>

        <Animated.View
          key={taglineIndex}
          entering={FadeIn.duration(260)}
          style={{ marginTop: 22, minHeight: 20, alignItems: 'center' }}
        >
          <Text style={{ color: colors.inkSecondary, fontFamily: fontFamily.semibold, fontSize: 13.5 }}>
            {TAGLINES[taglineIndex]}
          </Text>
        </Animated.View>

        <View style={{ marginTop: 16 }}>
          <LoadingDots progress={dots} />
        </View>
      </View>
    </Animated.View>
  );
}
