import { useEffect, useRef, useState } from 'react';
import { View, Text, Pressable, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  FadeIn,
  FadeOut,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { useAudioRecorder, useAudioRecorderState, RecordingPresets, setAudioModeAsync } from 'expo-audio';
import * as Speech from 'expo-speech';
import * as Haptics from 'expo-haptics';
import { X, Square } from 'lucide-react-native';
import { colors, fontFamily, shadow } from '@/theme/tokens';
import { useAppDispatch } from '@/store/hooks';
import { setSpeakingMessage } from '@/store/slices/lunaSlice';
import { showToast } from '@/store/slices/toastSlice';
import { useSendLunaVoiceMessageMutation } from '@/store/api/aiApi';

type Phase = 'listening' | 'sending' | 'speaking' | 'error';

interface VoiceModeOverlayProps {
  conversationId: string | null;
  onConversationStarted: (id: string) => void;
  onExit: () => void;
}

/**
 * Hands-free voice loop: tap the orb to end your turn, LUNA answers aloud, then it
 * automatically starts listening again — until you tap the exit control. Each turn
 * still requires one tap to signal "I'm done talking" (no real silence/VAD detection);
 * only the "listen again after LUNA replies" part is automatic.
 */
export function VoiceModeOverlay({ conversationId, onConversationStarted, onExit }: VoiceModeOverlayProps) {
  const dispatch = useAppDispatch();
  const insets = useSafeAreaInsets();
  const [sendVoice] = useSendLunaVoiceMessageMutation();
  const recorder = useAudioRecorder({ ...RecordingPresets.HIGH_QUALITY, isMeteringEnabled: true });
  const state = useAudioRecorderState(recorder, 110);
  const [phase, setPhase] = useState<Phase>('listening');
  const exitedRef = useRef(false);
  const conversationRef = useRef(conversationId);
  conversationRef.current = conversationId;

  const pulse = useSharedValue(1);
  useEffect(() => {
    if (phase === 'listening') {
      pulse.value = withRepeat(
        withSequence(
          withTiming(1.12, { duration: 700, easing: Easing.inOut(Easing.sin) }),
          withTiming(1, { duration: 700, easing: Easing.inOut(Easing.sin) }),
        ),
        -1,
        false,
      );
    } else {
      pulse.value = withTiming(1, { duration: 150 });
    }
  }, [phase, pulse]);
  const pulseStyle = useAnimatedStyle(() => ({ transform: [{ scale: pulse.value }] }));

  const startRecording = async () => {
    try {
      await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
      await recorder.prepareToRecordAsync();
      if (exitedRef.current) return;
      recorder.record();
      setPhase('listening');
    } catch {
      if (!exitedRef.current) setPhase('error');
    }
  };

  useEffect(() => {
    startRecording();
    return () => {
      exitedRef.current = true;
      Speech.stop().catch(() => {});
      try {
        if (recorder.isRecording) recorder.stop().catch(() => {});
      } catch {
        // native recorder already released
      }
      setAudioModeAsync({ allowsRecording: false }).catch(() => {});
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const stopAndSend = async () => {
    if (phase !== 'listening' || !state.isRecording) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});

    let uri: string | null = null;
    try {
      await recorder.stop();
      uri = recorder.uri;
    } catch {
      uri = null;
    }

    if (!uri || state.durationMillis < 350) {
      startRecording();
      return;
    }

    setPhase('sending');
    try {
      const result = await sendVoice({ conversationId: conversationRef.current ?? undefined, uri }).unwrap();
      if (exitedRef.current) return;
      if (!conversationRef.current) onConversationStarted(result.conversationId);

      await setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true });
      setPhase('speaking');
      dispatch(setSpeakingMessage(result.assistantMessageId));
      Speech.speak(result.reply, {
        rate: 1.0,
        onDone: () => {
          dispatch(setSpeakingMessage(null));
          if (!exitedRef.current) startRecording();
        },
        onStopped: () => { dispatch(setSpeakingMessage(null)); },
        onError: () => {
          dispatch(setSpeakingMessage(null));
          if (!exitedRef.current) startRecording();
        },
      });
    } catch {
      if (exitedRef.current) return;
      dispatch(showToast({ variant: 'error', message: 'Could not process that — try again.' }));
      startRecording();
    }
  };

  const handleExit = () => {
    exitedRef.current = true;
    Speech.stop().catch(() => {});
    dispatch(setSpeakingMessage(null));
    onExit();
  };

  const statusText =
    phase === 'listening'
      ? 'Listening… tap to send'
      : phase === 'sending'
        ? 'Thinking…'
        : phase === 'speaking'
          ? 'Speaking…'
          : "Couldn't hear that — tap to try again";

  return (
    <Animated.View
      entering={FadeIn.duration(200)}
      exiting={FadeOut.duration(150)}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: colors.bg,
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100,
      }}
    >
      <View style={{ position: 'absolute', top: insets.top + 12, right: 20 }}>
        <Pressable
          onPress={handleExit}
          hitSlop={12}
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: colors.glassFillStrong,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <X size={19} color={colors.ink} />
        </Pressable>
      </View>

      <Pressable onPress={stopAndSend} disabled={phase !== 'listening'}>
        <Animated.View
          style={[
            {
              width: 160,
              height: 160,
              borderRadius: 80,
              backgroundColor: colors.primary500,
              alignItems: 'center',
              justifyContent: 'center',
              ...shadow.glow(colors.primary500),
            },
            pulseStyle,
          ]}
        >
          {phase === 'listening' ? (
            <Square size={36} color={colors.inkOnPrimary} fill={colors.inkOnPrimary} />
          ) : (
            <ActivityIndicator color={colors.inkOnPrimary} />
          )}
        </Animated.View>
      </Pressable>

      <Text style={{ marginTop: 28, color: colors.inkSecondary, fontFamily: fontFamily.semibold, fontSize: 15 }}>
        {statusText}
      </Text>
    </Animated.View>
  );
}
