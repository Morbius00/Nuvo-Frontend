import { useEffect, useRef, useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { useAudioRecorder, useAudioRecorderState, RecordingPresets, setAudioModeAsync } from 'expo-audio';
import * as Haptics from 'expo-haptics';
import { Trash2, Check } from 'lucide-react-native';
import { colors, fontFamily, radii } from '@/theme/tokens';
import { formatDuration } from '@/utils/format';
import { LiquidGlassSurface } from '@/components/ui/LiquidGlassSurface';

const BAR_COUNT = 26;
const MIN_LEVEL = 0.12;

// Maps an iOS/Android metering reading (roughly -60dB..0dB) to a 0..1 bar-height fraction.
function normalizeMetering(db: number | undefined) {
  if (typeof db !== 'number' || !isFinite(db)) return MIN_LEVEL;
  return Math.min(1, Math.max(MIN_LEVEL, (db + 60) / 60));
}

interface VoiceRecorderBarProps {
  onSend: (uri: string, durationMs: number) => void;
  onCancel: () => void;
}

/** Real microphone recording (expo-audio) with a live amplitude waveform driven by actual mic metering. */
export function VoiceRecorderBar({ onSend, onCancel }: VoiceRecorderBarProps) {
  const recorder = useAudioRecorder({ ...RecordingPresets.HIGH_QUALITY, isMeteringEnabled: true });
  const state = useAudioRecorderState(recorder, 110);
  const [levels, setLevels] = useState<number[]>(() => Array(BAR_COUNT).fill(MIN_LEVEL));
  const settling = useRef(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
        await recorder.prepareToRecordAsync();
        if (cancelled) return;
        recorder.record();
      } catch {
        // Recorder may already be torn down (e.g. a Fast Refresh remount) — nothing to recover.
      }
    })();
    return () => {
      cancelled = true;
      try {
        if (recorder.isRecording) recorder.stop().catch(() => {});
      } catch {
        // Native recorder object already released.
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!state.isRecording) return;
    setLevels((prev) => [...prev.slice(1), normalizeMetering(state.metering)]);
  }, [state.metering, state.isRecording]);

  const finish = async (deliver: boolean) => {
    if (settling.current) return;
    settling.current = true;
    Haptics.impactAsync(deliver ? Haptics.ImpactFeedbackStyle.Medium : Haptics.ImpactFeedbackStyle.Light).catch(() => {});

    let uri: string | null = null;
    try {
      await recorder.stop();
      uri = recorder.uri;
    } catch {
      uri = null;
    }

    if (deliver && uri && state.durationMillis > 350) {
      onSend(uri, state.durationMillis);
    } else {
      onCancel();
    }
  };

  return (
    <Animated.View entering={FadeIn.duration(180)} exiting={FadeOut.duration(150)}>
      <LiquidGlassSurface
        radius={radii.lg}
        borderWidth={1.5}
        contentStyle={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 12, height: 58 }}
      >
        <Pressable
          onPress={() => finish(false)}
          hitSlop={8}
          style={{
            width: 36,
            height: 36,
            borderRadius: 18,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: colors.glassFillStrong,
          }}
        >
          <Trash2 size={16} color={colors.danger400} />
        </Pressable>

        <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: colors.danger500 }} />
        <Text style={{ color: colors.ink, fontFamily: fontFamily.semibold, fontSize: 13, minWidth: 36 }}>
          {formatDuration(state.durationMillis)}
        </Text>

        <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 2, height: 26 }}>
          {levels.map((level, i) => (
            <View
              key={i}
              style={{
                flex: 1,
                height: Math.max(3, level * 24),
                borderRadius: 2,
                backgroundColor: colors.primary400,
                opacity: 0.55 + level * 0.45,
              }}
            />
          ))}
        </View>

        <Pressable
          onPress={() => finish(true)}
          hitSlop={8}
          style={{
            width: 38,
            height: 38,
            borderRadius: 19,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: colors.primary500,
          }}
        >
          <Check size={17} color={colors.inkOnPrimary} />
        </Pressable>
      </LiquidGlassSurface>
    </Animated.View>
  );
}
