import { useEffect, useState } from 'react';
import { View, Text } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as ImagePicker from 'expo-image-picker';
import Animated, {
  FadeInDown,
  FadeInUp,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { X, QrCode, ImagePlus, Smartphone, MessageSquare, Loader } from 'lucide-react-native';
import { Screen } from '@/components/ui/Screen';
import { GlassCard } from '@/components/ui/GlassCard';
import { Chip } from '@/components/ui/Chip';
import { IconButton } from '@/components/ui/IconButton';
import { colors, fontFamily, radii } from '@/theme/tokens';
import { useParseUpiScreenshotMutation } from '@/store/api/transactionsApi';
import { useCrossNavigation } from '@/hooks/useCrossNavigation';
import { TransactionsStackParamList } from '@/navigation/types';

type Nav = NativeStackNavigationProp<TransactionsStackParamList>;

const SUPPORTED_APPS = [
  { label: 'Google Pay', icon: Smartphone },
  { label: 'PhonePe', icon: Smartphone },
  { label: 'Paytm', icon: Smartphone },
  { label: 'BHIM', icon: Smartphone },
  { label: 'Bank SMS', icon: MessageSquare },
];

type Status = 'idle' | 'analyzing';

export function UpiImportScreen() {
  const navigation = useNavigation<Nav>();
  const crossNav = useCrossNavigation();
  const [status, setStatus] = useState<Status>('idle');
  const [phase, setPhase] = useState<'detecting' | 'extracting'>('detecting');
  const [parseUpiScreenshot] = useParseUpiScreenshotMutation();

  const pulse = useSharedValue(1);

  useEffect(() => {
    if (status === 'analyzing') {
      pulse.value = withRepeat(withSequence(withTiming(0.4, { duration: 500 }), withTiming(1, { duration: 500 })), -1);
    } else {
      pulse.value = withTiming(1, { duration: 150 });
    }
  }, [status, pulse]);

  const pulseStyle = useAnimatedStyle(() => ({ opacity: pulse.value }));

  const handleTap = async () => {
    if (status !== 'idle') return;

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return;

    const picked = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.8 });
    if (picked.canceled || !picked.assets?.length) return;

    setStatus('analyzing');
    setPhase('detecting');
    const phaseTimer = setTimeout(() => setPhase('extracting'), 600);

    const [result] = await Promise.all([
      parseUpiScreenshot({ uri: picked.assets[0].uri })
        .unwrap()
        .catch(() => null),
      new Promise((resolve) => setTimeout(resolve, 1200)),
    ]);

    clearTimeout(phaseTimer);
    setStatus('idle');
    if (result) crossNav.toRoot('TransactionConfirm', { transactionId: result.transactionId, jobId: result.jobId });
  };

  const isAnalyzing = status === 'analyzing';

  return (
    <Screen scroll>
      <View style={{ paddingHorizontal: 20, paddingTop: 4, gap: 22 }}>
        <Animated.View
          entering={FadeInDown.springify()}
          style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
        >
          <Text style={{ color: colors.ink, fontFamily: fontFamily.extrabold, fontSize: 20 }}>Import UPI Screenshot</Text>
          <IconButton
            variant="glass"
            size={40}
            icon={<X size={18} color={colors.ink} />}
            onPress={() => navigation.goBack()}
          />
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(60).springify()}>
          <Text style={{ color: colors.inkSecondary, fontFamily: fontFamily.medium, fontSize: 14, lineHeight: 20 }}>
            NUVO reads your UPI payment confirmation screenshot and automatically fills in the merchant, amount and
            reference ID — you just confirm it.
          </Text>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(120).springify()}>
          <GlassCard onPress={handleTap} radius={radii.xl}>
            <View
              style={{
                margin: 16,
                borderWidth: 1.5,
                borderStyle: 'dashed',
                borderColor: isAnalyzing ? colors.primary500 : colors.glassBorder,
                borderRadius: radii.lg,
                paddingVertical: 44,
                alignItems: 'center',
                gap: 14,
              }}
            >
              <Animated.View style={isAnalyzing ? pulseStyle : undefined}>
                <View
                  style={{
                    width: 64,
                    height: 64,
                    borderRadius: 32,
                    backgroundColor: colors.glassFillStrong,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {isAnalyzing ? (
                    <Loader size={26} color={colors.primary400} />
                  ) : (
                    <ImagePlus size={26} color={colors.primary400} />
                  )}
                </View>
              </Animated.View>

              {isAnalyzing ? (
                <View style={{ alignItems: 'center', gap: 4 }}>
                  <Text style={{ color: colors.ink, fontFamily: fontFamily.bold, fontSize: 14.5 }}>
                    {phase === 'detecting' ? 'Detecting app…' : 'Extracting fields…'}
                  </Text>
                  <Text style={{ color: colors.inkMuted, fontFamily: fontFamily.medium, fontSize: 12 }}>
                    Hold tight, this only takes a moment
                  </Text>
                </View>
              ) : (
                <View style={{ alignItems: 'center', gap: 4 }}>
                  <Text style={{ color: colors.ink, fontFamily: fontFamily.bold, fontSize: 14.5 }}>
                    Tap to select a screenshot
                  </Text>
                  <Text style={{ color: colors.inkMuted, fontFamily: fontFamily.medium, fontSize: 12 }}>
                    PNG or JPG from your gallery
                  </Text>
                </View>
              )}
            </View>
          </GlassCard>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(180).springify()} style={{ gap: 10 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <QrCode size={15} color={colors.inkMuted} />
            <Text style={{ color: colors.inkMuted, fontFamily: fontFamily.semibold, fontSize: 12 }}>
              Supported apps
            </Text>
          </View>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {SUPPORTED_APPS.map((app) => (
              <Chip key={app.label} label={app.label} icon={<app.icon size={13} color={colors.inkSecondary} />} />
            ))}
          </View>
        </Animated.View>
      </View>
    </Screen>
  );
}
