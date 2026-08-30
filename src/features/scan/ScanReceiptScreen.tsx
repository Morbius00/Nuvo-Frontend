import { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  FadeIn, FadeInDown, FadeInUp, FadeOut, ZoomIn,
  useSharedValue, useAnimatedStyle, withRepeat, withSequence, withTiming, Easing,
} from 'react-native-reanimated';
import { X, ScanLine, Zap, Tag, FileText } from 'lucide-react-native';
import { Screen } from '@/components/ui/Screen';
import { GlassCard } from '@/components/ui/GlassCard';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { IconButton } from '@/components/ui/IconButton';
import { FloatingImage } from '@/components/ui/FloatingImage';
import { colors, fontFamily, radii } from '@/theme/tokens';
import { RootStackParamList } from '@/navigation/types';
import { useScanReceiptMutation } from '@/store/api/transactionsApi';

type Nav = NativeStackNavigationProp<RootStackParamList, 'ScanReceipt'>;

/** Mirrors spec §7.1 Figure 7.1 OCR pipeline stages — purely cosmetic, cycles while the mutation is in flight. */
const PROCESSING_STEPS = ['Checking image quality…', 'Preprocessing…', 'Running OCR…', 'Categorising…'];

type Phase = 'camera' | 'processing' | 'error';

export function ScanReceiptScreen() {
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [phase, setPhase] = useState<Phase>('camera');
  const [stepIndex, setStepIndex] = useState(0);
  const [scanReceipt] = useScanReceiptMutation();

  // ── Google-Lens scan line — must be declared before any early returns ──
  const VIEWFINDER_H = 380;
  const scanY = useSharedValue(0);
  const scanLineStyle = useAnimatedStyle(() => ({ transform: [{ translateY: scanY.value }] }));
  useEffect(() => {
    scanY.value = withRepeat(
      withSequence(
        withTiming(VIEWFINDER_H - 4, { duration: 2200, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: 2200, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      false,
    );
  }, [scanY]);

  useEffect(() => {
    if (phase !== 'processing') return;
    setStepIndex(0);
    const id = setInterval(() => {
      setStepIndex((i) => Math.min(i + 1, PROCESSING_STEPS.length - 1));
    }, 650);
    return () => clearInterval(id);
  }, [phase]);

  const runScan = useCallback(
    async (uri: string) => {
      setPhase('processing');
      try {
        const result = await scanReceipt({ uri }).unwrap();
        navigation.replace('TransactionConfirm', { transactionId: result.transactionId, jobId: result.jobId });
      } catch {
        setPhase('error');
      }
    },
    [navigation, scanReceipt],
  );

  const onCapture = async () => {
    if (!cameraReady || !cameraRef.current) return;
    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.5 });
      await runScan(photo?.uri ?? '');
    } catch {
      setPhase('error');
    }
  };

  // Permissions not yet resolved.
  if (!permission) {
    return <Screen aurora={false}>{null}</Screen>;
  }

  if (!permission.granted) {
    return (
      <Screen>
        <View style={{ flex: 1, paddingHorizontal: 28, alignItems: 'center', justifyContent: 'center', gap: 22 }}>
          <Animated.View entering={ZoomIn.springify().delay(60)}>
            <FloatingImage source={require('../../../assets/LUNA-BillScan.png')} size={200} />
          </Animated.View>
          <Animated.View entering={FadeInDown.delay(140).springify()} style={{ alignItems: 'center', gap: 8 }}>
            <Text style={{ color: colors.ink, fontFamily: fontFamily.extrabold, fontSize: 21, textAlign: 'center' }}>
              Camera access needed
            </Text>
            <Text
              style={{
                color: colors.inkSecondary,
                fontFamily: fontFamily.medium,
                fontSize: 14,
                textAlign: 'center',
                lineHeight: 20,
                maxWidth: 280,
              }}
            >
              NUVO scans receipts to auto-fill merchant, amount and category — grant camera access to continue.
            </Text>
          </Animated.View>
          <Animated.View entering={FadeInUp.delay(220).springify()} style={{ width: '100%', gap: 12, marginTop: 8 }}>
            <PrimaryButton label="Grant Camera Access" onPress={requestPermission} />
            <Text
              onPress={() => navigation.goBack()}
              style={{ color: colors.inkMuted, fontFamily: fontFamily.semibold, fontSize: 14, textAlign: 'center', paddingVertical: 8 }}
            >
              Not now
            </Text>
          </Animated.View>
        </View>
      </Screen>
    );
  }

  if (phase === 'processing') {
    return (
      <Screen>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 28, paddingHorizontal: 32 }}>
          <Animated.View entering={ZoomIn.springify()}>
            <GlassCard radius={999} glow={colors.primary500} style={{ width: 104, height: 104 }}>
              <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                <ScanLine size={44} color={colors.primary400} />
              </View>
            </GlassCard>
          </Animated.View>
          <View style={{ height: 26, alignItems: 'center', justifyContent: 'center' }}>
            <Animated.Text
              key={stepIndex}
              entering={FadeIn.duration(220)}
              exiting={FadeOut.duration(180)}
              style={{ color: colors.ink, fontFamily: fontFamily.semibold, fontSize: 15 }}
            >
              {PROCESSING_STEPS[stepIndex]}
            </Animated.Text>
          </View>
        </View>
      </Screen>
    );
  }

  if (phase === 'error') {
    return (
      <Screen>
        <View style={{ position: 'absolute', top: insets.top + 8, left: 20, zIndex: 10 }}>
          <IconButton variant="glass" size={40} icon={<X size={18} color={colors.ink} />} onPress={() => navigation.goBack()} />
        </View>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32, gap: 22 }}>
          <Animated.View entering={ZoomIn.springify()}>
            <FloatingImage source={require('../../../assets/LUNA-Errorimage.png')} size={180} />
          </Animated.View>
          <Animated.View entering={FadeInDown.delay(100).springify()} style={{ alignItems: 'center', gap: 8 }}>
            <Text style={{ color: colors.ink, fontFamily: fontFamily.extrabold, fontSize: 19, textAlign: 'center' }}>
              Couldn’t read that receipt
            </Text>
            <Text
              style={{
                color: colors.inkSecondary,
                fontFamily: fontFamily.medium,
                fontSize: 13.5,
                textAlign: 'center',
                lineHeight: 19,
                maxWidth: 260,
              }}
            >
              Make sure the receipt is well-lit and flat, then try again.
            </Text>
          </Animated.View>
          <PrimaryButton label="Retry" onPress={() => setPhase('camera')} style={{ marginTop: 8 }} />
        </View>
      </Screen>
    );
  }

  // ── Camera view ──────────────────────────────────────────────────
  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      <CameraView ref={cameraRef} style={StyleSheet.absoluteFill} facing="back" onCameraReady={() => setCameraReady(true)} />

      {/* Dark vignette overlay */}
      <View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.45)' }]} />

      {/* ── Header ─────────────────────────────────────────── */}
      <Animated.View
        entering={FadeInDown.springify()}
        pointerEvents="box-none"
        style={{ position: 'absolute', top: insets.top + 8, left: 0, right: 0, paddingHorizontal: 20 }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <IconButton variant="glass" size={42} icon={<X size={18} color={colors.ink} />} onPress={() => navigation.goBack()} />
          <View style={{ flex: 1, marginLeft: 14 }}>
            <Text style={{ color: '#fff', fontFamily: fontFamily.extrabold, fontSize: 20 }}>Scan Receipt</Text>
            <Text style={{ color: 'rgba(255,255,255,0.60)', fontFamily: fontFamily.medium, fontSize: 12.5, marginTop: 1 }}>
              Point at any receipt, bill or invoice
            </Text>
          </View>
        </View>

        {/* Info chips */}
        <Animated.View entering={FadeInDown.delay(120).springify()} style={{ flexDirection: 'row', gap: 8, marginTop: 14 }}>
          {[
            { icon: Zap, label: 'Instant scan' },
            { icon: Tag, label: 'Auto-category' },
            { icon: FileText, label: 'Auto-extract' },
          ].map(({ icon: Icon, label }) => (
            <View
              key={label}
              style={{
                flexDirection: 'row', alignItems: 'center', gap: 5,
                backgroundColor: 'rgba(255,255,255,0.12)',
                borderWidth: 1, borderColor: 'rgba(255,255,255,0.18)',
                paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20,
              }}
            >
              <Icon size={11} color={colors.primary400} />
              <Text style={{ color: 'rgba(255,255,255,0.80)', fontFamily: fontFamily.semibold, fontSize: 11 }}>{label}</Text>
            </View>
          ))}
        </Animated.View>
      </Animated.View>

      {/* ── Viewfinder ─────────────────────────────────────── */}
      <View pointerEvents="none" style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <View style={{ width: 280, height: VIEWFINDER_H }}>

          {/* Corner brackets */}
          {[
            { top: 0, left: 0, borderTopWidth: 3, borderLeftWidth: 3, borderTopLeftRadius: 12 },
            { top: 0, right: 0, borderTopWidth: 3, borderRightWidth: 3, borderTopRightRadius: 12 },
            { bottom: 0, left: 0, borderBottomWidth: 3, borderLeftWidth: 3, borderBottomLeftRadius: 12 },
            { bottom: 0, right: 0, borderBottomWidth: 3, borderRightWidth: 3, borderBottomRightRadius: 12 },
          ].map((s, i) => (
            <View key={i} style={[{ position: 'absolute', width: 28, height: 28, borderColor: colors.primary400 }, s]} />
          ))}

          {/* Sweeping scan line */}
          <Animated.View pointerEvents="none" style={[{ position: 'absolute', left: 0, right: 0 }, scanLineStyle]}>
            <LinearGradient
              colors={['rgba(78,240,138,0)', 'rgba(78,240,138,0.85)', 'rgba(78,240,138,0)']}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              style={{ height: 2, width: '100%' }}
            />
            {/* Glow bloom under line */}
            <LinearGradient
              colors={['rgba(78,240,138,0)', 'rgba(78,240,138,0.12)', 'rgba(78,240,138,0)']}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              style={{ height: 18, width: '100%', marginTop: -10 }}
            />
          </Animated.View>
        </View>

        <Text style={{ marginTop: 22, color: 'rgba(255,255,255,0.70)', fontFamily: fontFamily.semibold, fontSize: 13 }}>
          Align receipt within the frame
        </Text>
      </View>

      {/* ── Capture button ─────────────────────────────────── */}
      <Animated.View
        entering={FadeInUp.delay(80).springify()}
        style={{ position: 'absolute', bottom: insets.bottom + 36, left: 0, right: 0, alignItems: 'center' }}
      >
        <Pressable
          onPress={onCapture}
          disabled={!cameraReady}
          style={({ pressed }) => ({
            width: 72, height: 72, borderRadius: 36,
            backgroundColor: pressed ? colors.primary600 : colors.primary500,
            alignItems: 'center', justifyContent: 'center',
            borderWidth: 4, borderColor: 'rgba(255,255,255,0.30)',
            opacity: cameraReady ? 1 : 0.4,
          })}
        >
          <ScanLine size={28} color={colors.inkOnPrimary} strokeWidth={2.5} />
        </Pressable>
        <Text style={{ color: 'rgba(255,255,255,0.50)', fontFamily: fontFamily.medium, fontSize: 12, marginTop: 10 }}>
          Tap to scan
        </Text>
      </Animated.View>
    </View>
  );
}
