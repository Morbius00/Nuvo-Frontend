import { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, ScrollView, Platform, KeyboardAvoidingView, Image, Alert, Pressable } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BottomSheetModal } from '@gorhom/bottom-sheet';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import * as Speech from 'expo-speech';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { getRecordingPermissionsAsync, requestRecordingPermissionsAsync } from 'expo-audio';
import { ScrollText, Mic, Send, Paperclip } from 'lucide-react-native';
import { Screen } from '@/components/ui/Screen';
import { IconButton } from '@/components/ui/IconButton';
import { Chip, Badge } from '@/components/ui/Chip';
import { Input } from '@/components/ui/Input';
import { colors, fontFamily, shadow } from '@/theme/tokens';
import { LunaStackParamList } from '@/navigation/types';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { addMessage, LunaAttachment, LunaMessage, LunaVoiceNote } from '@/store/slices/lunaSlice';
import { useLunaChatMutation } from '@/store/api/aiApi';
import { LunaSplash } from './LunaSplash';
import { AssistantBubble, UserBubble, TypingDots, VoiceMessageBubble, AttachmentThumb } from './components/ChatBubbles';
import { VoiceRecorderBar } from './components/VoiceRecorderBar';
import { AttachSheet } from './components/AttachSheet';
import { PendingAttachmentStrip } from './components/PendingAttachments';

type Nav = NativeStackNavigationProp<LunaStackParamList>;

const SUGGESTIONS = ['Spending this month', 'Any savings ideas?', 'Check my goals', 'My subscriptions'];

export function AdvisorChatScreen() {
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const dispatch = useAppDispatch();
  const user = useAppSelector((s) => s.auth.user);
  const messages = useAppSelector((s) => s.luna.messages);
  const [chat, { isLoading }] = useLunaChatMutation();

  const [draft, setDraft] = useState('');
  const [showSplash, setShowSplash] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const [pendingAttachments, setPendingAttachments] = useState<LunaAttachment[]>([]);
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const scrollRef = useRef<ScrollView>(null);
  const attachSheetRef = useRef<BottomSheetModal>(null);

  const inputBarBottom = Math.max(insets.bottom, 14) + 68 + 14;

  // Every time this tab gains focus, replay the LUNA intro.
  useFocusEffect(
    useCallback(() => {
      setShowSplash(true);
    }, []),
  );

  useEffect(() => {
    const id = setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 80);
    return () => clearTimeout(id);
  }, [messages.length, isLoading]);

  useEffect(() => {
    return () => {
      Speech.stop().catch(() => {});
    };
  }, []);

  const sendMessage = async (
    text: string,
    extra?: { attachments?: LunaAttachment[]; voice?: LunaVoiceNote },
  ) => {
    const trimmed = text.trim();
    if (!trimmed && !extra?.attachments?.length && !extra?.voice) return;

    const userMsg: LunaMessage = {
      id: `user_${Date.now()}`,
      role: 'user',
      body: trimmed,
      createdAt: new Date().toISOString(),
      attachments: extra?.attachments,
      voice: extra?.voice,
    };
    dispatch(addMessage(userMsg));
    setDraft('');
    setPendingAttachments([]);

    const chatMessage =
      trimmed ||
      (extra?.voice
        ? 'Sent a voice message.'
        : extra?.attachments?.length
          ? `Shared ${extra.attachments.length > 1 ? `${extra.attachments.length} files` : extra.attachments[0].name ?? 'a file'}.`
          : '');

    try {
      const result = await chat({ message: chatMessage }).unwrap();
      dispatch(
        addMessage({ id: `assistant_${Date.now()}`, role: 'assistant', body: result.reply, createdAt: new Date().toISOString() }),
      );
    } catch (err) {
      const status = (err as { status?: number } | undefined)?.status;
      dispatch(
        addMessage({
          id: `err_${Date.now()}`,
          role: 'assistant',
          body:
            status === 403
              ? 'LUNA chat is a NUVO Premium feature — upgrade to unlock it.'
              : "Sorry, I couldn't reach my brain just now — try again in a moment.",
          createdAt: new Date().toISOString(),
        }),
      );
    }
  };

  const handleSend = () => {
    sendMessage(draft, { attachments: pendingAttachments.length ? pendingAttachments : undefined });
  };

  const onMicPress = async () => {
    const current = await getRecordingPermissionsAsync();
    let granted = current.granted;
    if (!granted) {
      const requested = await requestRecordingPermissionsAsync();
      granted = requested.granted;
    }
    if (!granted) {
      Alert.alert('Microphone access needed', 'Allow microphone access in Settings to send LUNA a voice message.');
      return;
    }
    setIsRecording(true);
  };

  const handleVoiceSend = (uri: string, durationMs: number) => {
    setIsRecording(false);
    sendMessage('', { voice: { uri, durationMs } });
  };

  const handleVoiceCancel = () => setIsRecording(false);

  const toggleSpeak = (message: LunaMessage) => {
    if (speakingId === message.id) {
      Speech.stop().catch(() => {});
      setSpeakingId(null);
      return;
    }
    Speech.stop().catch(() => {});
    setSpeakingId(message.id);
    Speech.speak(message.body, {
      rate: 1.0,
      onDone: () => setSpeakingId(null),
      onStopped: () => setSpeakingId(null),
      onError: () => setSpeakingId(null),
    });
  };

  const openAttachSheet = () => attachSheetRef.current?.present();

  const handlePickPhoto = async () => {
    attachSheetRef.current?.dismiss();
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Photo access needed', 'Allow photo library access in Settings to attach images.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      selectionLimit: 4,
      quality: 0.7,
    });
    if (result.canceled || !result.assets?.length) return;
    const attachments: LunaAttachment[] = result.assets.map((a, i) => ({
      id: `img_${Date.now()}_${i}`,
      kind: 'image',
      uri: a.uri,
      name: a.fileName ?? undefined,
      size: a.fileSize,
      mimeType: a.mimeType,
    }));
    setPendingAttachments((prev) => [...prev, ...attachments]);
  };

  const handlePickDocument = async () => {
    attachSheetRef.current?.dismiss();
    const result = await DocumentPicker.getDocumentAsync({ type: '*/*', multiple: true });
    if (result.canceled || !result.assets?.length) return;
    const attachments: LunaAttachment[] = result.assets.map((a, i) => ({
      id: `doc_${Date.now()}_${i}`,
      kind: 'file',
      uri: a.uri,
      name: a.name,
      size: a.size,
      mimeType: a.mimeType,
    }));
    setPendingAttachments((prev) => [...prev, ...attachments]);
  };

  const removePendingAttachment = (id: string) => {
    setPendingAttachments((prev) => prev.filter((a) => a.id !== id));
  };

  const canSend = draft.trim().length > 0 || pendingAttachments.length > 0;

  return (
    <Screen edges={['top', 'left', 'right']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Animated.View
          entering={FadeInDown.springify()}
          style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 4, gap: 12 }}
        >
          <View>
            <Image
              source={require('../../../assets/luna-profile-pic.png')}
              style={{ width: 46, height: 46, borderRadius: 16, ...shadow.glow(colors.primary500) }}
            />
            <View
              style={{
                position: 'absolute',
                bottom: -2,
                right: -2,
                width: 13,
                height: 13,
                borderRadius: 7,
                backgroundColor: colors.primary400,
                borderWidth: 2,
                borderColor: colors.bg,
              }}
            />
          </View>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Text style={{ color: colors.ink, fontFamily: fontFamily.extrabold, fontSize: 19 }}>LUNA</Text>
              {user?.isPremium && <Badge label="PREMIUM" subtle color={colors.primary400} />}
            </View>
            <Text style={{ color: colors.inkMuted, fontFamily: fontFamily.medium, fontSize: 12.5 }}>
              Your AI Financial Advisor
            </Text>
          </View>
          <IconButton
            variant="glass"
            size={42}
            icon={<ScrollText size={18} color={colors.ink} />}
            onPress={() => navigation.navigate('Insights')}
          />
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(80).springify()} style={{ marginTop: 14 }}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 20, gap: 8 }}
          >
            {SUGGESTIONS.map((s) => (
              <Chip key={s} label={s} onPress={() => sendMessage(s)} />
            ))}
          </ScrollView>
        </Animated.View>

        <View style={{ flex: 1 }}>
          <ScrollView
            ref={scrollRef}
            style={{ flex: 1 }}
            contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: inputBarBottom + 90 }}
            showsVerticalScrollIndicator={false}
          >
            {messages.map((m) => (
              <Animated.View
                key={m.id}
                entering={FadeInUp.springify()}
                style={{
                  flexDirection: 'row',
                  justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start',
                  marginBottom: 14,
                }}
              >
                {m.role === 'user' ? (
                  <UserBubble>
                    {m.attachments?.length ? (
                      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                        {m.attachments.map((a) => (
                          <AttachmentThumb key={a.id} attachment={a} tint="dark" />
                        ))}
                      </View>
                    ) : null}
                    {m.voice ? <VoiceMessageBubble voice={m.voice} tint="dark" /> : null}
                    {m.body ? (
                      <Text
                        style={{ color: colors.inkOnPrimary, fontFamily: fontFamily.semibold, fontSize: 14.5, lineHeight: 20 }}
                      >
                        {m.body}
                      </Text>
                    ) : null}
                  </UserBubble>
                ) : (
                  <AssistantBubble speakable speaking={speakingId === m.id} onToggleSpeak={() => toggleSpeak(m)}>
                    <Text style={{ color: colors.ink, fontFamily: fontFamily.medium, fontSize: 14.5, lineHeight: 20 }}>
                      {m.body}
                    </Text>
                  </AssistantBubble>
                )}
              </Animated.View>
            ))}
            {isLoading && (
              <Animated.View
                entering={FadeInUp.springify()}
                style={{ flexDirection: 'row', justifyContent: 'flex-start', marginBottom: 14 }}
              >
                <AssistantBubble>
                  <TypingDots />
                </AssistantBubble>
              </Animated.View>
            )}
          </ScrollView>

          <LinearGradient
            pointerEvents="none"
            colors={['rgba(3,8,17,0)', colors.bg]}
            style={{ position: 'absolute', left: 0, right: 0, bottom: inputBarBottom - 10, height: 46 }}
          />

          <View style={{ position: 'absolute', left: 20, right: 20, bottom: inputBarBottom }}>
            {!isRecording && (
              <PendingAttachmentStrip attachments={pendingAttachments} onRemove={removePendingAttachment} />
            )}

            {isRecording ? (
              <VoiceRecorderBar onSend={handleVoiceSend} onCancel={handleVoiceCancel} />
            ) : (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <View style={{ flex: 1 }}>
                  <Input
                    value={draft}
                    onChangeText={setDraft}
                    placeholder="Ask LUNA anything…"
                    returnKeyType="send"
                    onSubmitEditing={handleSend}
                    leftIcon={
                      <Pressable onPress={openAttachSheet} hitSlop={10}>
                        <Paperclip size={19} color={colors.inkSecondary} />
                      </Pressable>
                    }
                    rightIcon={
                      <Pressable onPress={onMicPress} hitSlop={10}>
                        <Mic size={19} color={colors.inkSecondary} />
                      </Pressable>
                    }
                  />
                </View>
                <IconButton
                  icon={<Send size={19} color={colors.inkOnPrimary} />}
                  size={46}
                  onPress={handleSend}
                  style={{ opacity: canSend ? 1 : 0.55 }}
                />
              </View>
            )}
          </View>
        </View>
      </KeyboardAvoidingView>

      {showSplash && <LunaSplash onFinish={() => setShowSplash(false)} />}
      <AttachSheet ref={attachSheetRef} onPickPhoto={handlePickPhoto} onPickDocument={handlePickDocument} />
    </Screen>
  );
}
