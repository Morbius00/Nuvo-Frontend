import { ReactNode, useEffect } from 'react';
import { View, Text, Image, Pressable, StyleSheet, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import { Volume2, VolumeX, Play, Pause, FileText } from 'lucide-react-native';
import { colors, fontFamily, primaryGradient, radii } from '@/theme/tokens';
import { formatDuration, formatFileSize } from '@/utils/format';
import { LunaAttachment, LunaVoiceNote } from '@/store/slices/lunaSlice';

export function AssistantBubble({
  children,
  speakable,
  speaking,
  onToggleSpeak,
}: {
  children: ReactNode;
  speakable?: boolean;
  speaking?: boolean;
  onToggleSpeak?: () => void;
}) {
  return (
    <View
      style={{
        maxWidth: '82%',
        flexDirection: 'row',
        alignItems: 'flex-end',
        gap: 6,
        borderRadius: radii.lg,
        borderBottomLeftRadius: 6,
        overflow: 'hidden',
        borderWidth: StyleSheet.hairlineWidth * 2,
        borderColor: speaking ? colors.primary400 : colors.glassBorder,
      }}
    >
      <BlurView
        intensity={40}
        tint="dark"
        experimentalBlurMethod={Platform.OS === 'android' ? 'dimezisBlurView' : undefined}
        style={StyleSheet.absoluteFill}
      />
      <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.glassFill }]} />
      <View style={{ flexShrink: 1, paddingHorizontal: 14, paddingVertical: 11 }}>{children}</View>
      {speakable && (
        <Pressable
          onPress={onToggleSpeak}
          hitSlop={10}
          style={{ paddingRight: 10, paddingBottom: 11, paddingLeft: 2 }}
        >
          {speaking ? <VolumeX size={15} color={colors.primary400} /> : <Volume2 size={15} color={colors.inkMuted} />}
        </Pressable>
      )}
    </View>
  );
}

export function UserBubble({ children }: { children: ReactNode }) {
  return (
    <LinearGradient
      colors={primaryGradient}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{
        maxWidth: '82%',
        borderRadius: radii.lg,
        borderBottomRightRadius: 6,
        paddingHorizontal: 14,
        paddingVertical: 11,
        gap: 8,
      }}
    >
      {children}
    </LinearGradient>
  );
}

export function TypingDots() {
  const d1 = useSharedValue(0.3);
  const d2 = useSharedValue(0.3);
  const d3 = useSharedValue(0.3);

  useEffect(() => {
    const pulse = () => withRepeat(withSequence(withTiming(1, { duration: 350 }), withTiming(0.3, { duration: 350 })), -1, true);
    d1.value = pulse();
    d2.value = withDelay(150, pulse());
    d3.value = withDelay(300, pulse());
  }, [d1, d2, d3]);

  const s1 = useAnimatedStyle(() => ({ opacity: d1.value }));
  const s2 = useAnimatedStyle(() => ({ opacity: d2.value }));
  const s3 = useAnimatedStyle(() => ({ opacity: d3.value }));
  const dot = { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.primary400 };

  return (
    <View style={{ flexDirection: 'row', gap: 5, paddingVertical: 2 }}>
      <Animated.View style={[s1, dot]} />
      <Animated.View style={[s2, dot]} />
      <Animated.View style={[s3, dot]} />
    </View>
  );
}

const WAVEFORM_BARS = 22;
// Deterministic pseudo-waveform silhouette — no live amplitude data is captured during recording.
const BAR_HEIGHTS = Array.from({ length: WAVEFORM_BARS }, (_, i) => {
  const t = i / (WAVEFORM_BARS - 1);
  return 4 + Math.round(Math.abs(Math.sin(t * Math.PI * 2.4 + t)) * 12);
});

export function VoiceMessageBubble({ voice, tint = 'dark' }: { voice: LunaVoiceNote; tint?: 'dark' | 'light' }) {
  const player = useAudioPlayer(voice.uri);
  const status = useAudioPlayerStatus(player);

  const progress = status.duration > 0 ? status.currentTime / status.duration : 0;
  const remainingMs = status.duration > 0 ? Math.max(0, status.duration - status.currentTime) * 1000 : voice.durationMs;

  useEffect(() => {
    if (status.didJustFinish) {
      player.seekTo(0).catch(() => {});
    }
  }, [status.didJustFinish, player]);

  const toggle = () => {
    if (status.playing) {
      player.pause();
    } else {
      if (status.didJustFinish || status.currentTime >= status.duration) player.seekTo(0).catch(() => {});
      player.play();
    }
  };

  const iconColor = tint === 'dark' ? colors.inkOnPrimary : colors.ink;

  return (
    <Pressable
      onPress={toggle}
      style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 2, minWidth: 190 }}
    >
      <View
        style={{
          width: 34,
          height: 34,
          borderRadius: 17,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: tint === 'dark' ? 'rgba(4,20,11,0.18)' : colors.glassFillStrong,
        }}
      >
        {status.playing ? (
          <Pause size={15} color={iconColor} fill={iconColor} />
        ) : (
          <Play size={15} color={iconColor} fill={iconColor} style={{ marginLeft: 2 }} />
        )}
      </View>
      <View style={{ flex: 1, flexDirection: 'row', alignItems: 'flex-end', gap: 2, height: 20 }}>
        {BAR_HEIGHTS.map((h, i) => {
          const active = i / WAVEFORM_BARS <= progress;
          return (
            <View
              key={i}
              style={{
                flex: 1,
                height: h,
                borderRadius: 2,
                backgroundColor: active
                  ? tint === 'dark'
                    ? colors.inkOnPrimary
                    : colors.primary400
                  : tint === 'dark'
                    ? 'rgba(4,20,11,0.32)'
                    : colors.glassBorder,
              }}
            />
          );
        })}
      </View>
      <Text
        style={{
          color: tint === 'dark' ? colors.inkOnPrimary : colors.inkSecondary,
          fontFamily: fontFamily.semibold,
          fontSize: 11,
          minWidth: 32,
        }}
      >
        {formatDuration(remainingMs)}
      </Text>
    </Pressable>
  );
}

export function AttachmentThumb({ attachment, tint = 'dark' }: { attachment: LunaAttachment; tint?: 'dark' | 'light' }) {
  if (attachment.kind === 'image') {
    return (
      <Image
        source={{ uri: attachment.uri }}
        style={{ width: 160, height: 120, borderRadius: radii.md, backgroundColor: colors.surface }}
        resizeMode="cover"
      />
    );
  }
  const onDark = tint === 'dark';
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingHorizontal: 10,
        paddingVertical: 8,
        borderRadius: radii.md,
        backgroundColor: onDark ? 'rgba(4,20,11,0.18)' : colors.glassFillStrong,
        minWidth: 170,
      }}
    >
      <FileText size={17} color={onDark ? colors.inkOnPrimary : colors.ink} />
      <View style={{ flex: 1 }}>
        <Text
          numberOfLines={1}
          style={{ color: onDark ? colors.inkOnPrimary : colors.ink, fontFamily: fontFamily.semibold, fontSize: 12.5 }}
        >
          {attachment.name ?? 'Document'}
        </Text>
        {typeof attachment.size === 'number' && (
          <Text
            style={{
              color: onDark ? 'rgba(4,20,11,0.6)' : colors.inkMuted,
              fontFamily: fontFamily.medium,
              fontSize: 10.5,
            }}
          >
            {formatFileSize(attachment.size)}
          </Text>
        )}
      </View>
    </View>
  );
}

