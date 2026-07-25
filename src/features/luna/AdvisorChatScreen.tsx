import { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, ScrollView, Platform, KeyboardAvoidingView, Image, Alert, Pressable, TextInput } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BottomSheetModal } from '@gorhom/bottom-sheet';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import * as Speech from 'expo-speech';
import * as Clipboard from 'expo-clipboard';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { getRecordingPermissionsAsync, requestRecordingPermissionsAsync } from 'expo-audio';
import { ScrollText, Mic, Send, Paperclip, History, Copy, Pencil, RefreshCw, VolumeX, AudioLines } from 'lucide-react-native';
import { Screen } from '@/components/ui/Screen';
import { IconButton } from '@/components/ui/IconButton';
import { Chip, Badge } from '@/components/ui/Chip';
import { Input } from '@/components/ui/Input';
import { colors, fontFamily, radii, shadow } from '@/theme/tokens';
import { LunaStackParamList } from '@/navigation/types';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { LunaAttachment, setActiveConversation, setSpeakingMessage, setVoiceModeActive } from '@/store/slices/lunaSlice';
import { showToast } from '@/store/slices/toastSlice';
import {
  useGetLunaMessagesQuery,
  useSendLunaMessageMutation,
  useSendLunaVoiceMessageMutation,
  useRegenerateLunaReplyMutation,
  useEditLunaMessageMutation,
} from '@/store/api/aiApi';
import { ChatMessage } from '@/types';
import { LunaSplash } from './LunaSplash';
import { ChatHistoryPanel } from './ChatHistoryPanel';
import { AssistantBubble, UserBubble, TypingDots, AttachmentThumb } from './components/ChatBubbles';
import { VoiceRecorderBar } from './components/VoiceRecorderBar';
import { AttachSheet } from './components/AttachSheet';
import { PendingAttachmentStrip } from './components/PendingAttachments';
import { VoiceModeOverlay } from './VoiceModeOverlay';

type Nav = NativeStackNavigationProp<LunaStackParamList>;

const SUGGESTIONS = ['Spending this month', 'Any savings ideas?', 'Check my goals', 'My subscriptions'];

const WELCOME_MESSAGE: ChatMessage = {
  _id: 'welcome',
  conversationId: 'welcome',
  role: 'assistant',
  body: "Hi, I'm LUNA — your financial intelligence. Ask me about your spending, goals, or subscriptions anytime.",
  inputMode: 'text',
  createdAt: new Date(0).toISOString(),
};

type PendingTurn =
  | { kind: 'text'; text: string; attachments?: LunaAttachment[]; status: 'sending' | 'error' }
  | { kind: 'voice'; uri: string; status: 'sending' | 'error' };

export function AdvisorChatScreen() {
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const dispatch = useAppDispatch();
  const user = useAppSelector((s) => s.auth.user);
  const activeConversationId = useAppSelector((s) => s.luna.activeConversationId);
  const speakingMessageId = useAppSelector((s) => s.luna.speakingMessageId);
  const voiceModeActive = useAppSelector((s) => s.luna.voiceModeActive);

  const { data: serverMessages } = useGetLunaMessagesQuery(activeConversationId ?? '', { skip: !activeConversationId });
  const [sendLunaMessage] = useSendLunaMessageMutation();
  const [sendLunaVoiceMessage] = useSendLunaVoiceMessageMutation();
  const [regenerateLunaReply] = useRegenerateLunaReplyMutation();
  const [editLunaMessage] = useEditLunaMessageMutation();

  const messages: ChatMessage[] = activeConversationId ? serverMessages ?? [] : [WELCOME_MESSAGE];

  const [draft, setDraft] = useState('');
  const [showSplash, setShowSplash] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const [pendingAttachments, setPendingAttachments] = useState<LunaAttachment[]>([]);
  const [pendingTurn, setPendingTurn] = useState<PendingTurn | null>(null);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');
  const [historyPanelOpen, setHistoryPanelOpen] = useState(false);
  const scrollRef = useRef<ScrollView>(null);
  const attachSheetRef = useRef<BottomSheetModal>(null);

  const inputBarBottom = Math.max(insets.bottom, 14) + 68 + 14;

  // Every time this tab gains focus, replay the LUNA intro; on blur, stop any speech —
  // this is the actual fix for TTS previously continuing to play after leaving the tab
  // (the old effect only ever ran its cleanup on unmount, which native-stack tabs rarely do).
  useFocusEffect(
    useCallback(() => {
      setShowSplash(true);
      return () => {
        Speech.stop().catch(() => {});
        dispatch(setSpeakingMessage(null));
      };
    }, [dispatch]),
  );

  useEffect(() => {
    const id = setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 80);
    return () => clearTimeout(id);
  }, [messages.length, pendingTurn]);

  useEffect(() => {
    return () => {
      Speech.stop().catch(() => {});
    };
  }, []);

  const submitText = async (text: string, attachments?: LunaAttachment[]) => {
    if (pendingTurn?.status === 'sending') return;
    setPendingTurn({ kind: 'text', text, attachments, status: 'sending' });
    try {
      const result = await sendLunaMessage({ conversationId: activeConversationId ?? undefined, message: text }).unwrap();
      if (!activeConversationId) dispatch(setActiveConversation(result.conversationId));
      setPendingTurn(null);
    } catch (err) {
      const status = (err as { status?: number } | undefined)?.status;
      if (status === 403) {
        dispatch(showToast({ variant: 'info', message: 'LUNA chat is a NUVO Premium feature — upgrade to unlock it.' }));
        setPendingTurn(null);
        return;
      }
      setPendingTurn({ kind: 'text', text, attachments, status: 'error' });
    }
  };

  const handleSend = () => {
    const attachmentText = pendingAttachments.length
      ? `Shared ${pendingAttachments.length > 1 ? `${pendingAttachments.length} files` : pendingAttachments[0].name ?? 'a file'}.`
      : '';
    const text = draft.trim() || attachmentText;
    if (!text) return;
    const attachments = pendingAttachments.length ? pendingAttachments : undefined;
    setDraft('');
    setPendingAttachments([]);
    submitText(text, attachments);
  };

  const handleVoiceSend = async (uri: string) => {
    setIsRecording(false);
    if (pendingTurn?.status === 'sending') return;
    setPendingTurn({ kind: 'voice', uri, status: 'sending' });
    try {
      const result = await sendLunaVoiceMessage({ conversationId: activeConversationId ?? undefined, uri }).unwrap();
      if (!activeConversationId) dispatch(setActiveConversation(result.conversationId));
      setPendingTurn(null);
    } catch {
      setPendingTurn({ kind: 'voice', uri, status: 'error' });
    }
  };

  const retryPending = () => {
    if (!pendingTurn) return;
    if (pendingTurn.kind === 'text') submitText(pendingTurn.text, pendingTurn.attachments);
    else handleVoiceSend(pendingTurn.uri);
  };

  const handleNewChat = () => {
    Speech.stop().catch(() => {});
    dispatch(setSpeakingMessage(null));
    dispatch(setActiveConversation(null));
    setPendingTurn(null);
    setEditingMessageId(null);
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

  const handleVoiceCancel = () => setIsRecording(false);

  const stopSpeaking = () => {
    Speech.stop().catch(() => {});
    dispatch(setSpeakingMessage(null));
  };

  const toggleSpeak = (message: ChatMessage) => {
    if (speakingMessageId === message._id) {
      stopSpeaking();
      return;
    }
    Speech.stop().catch(() => {});
    dispatch(setSpeakingMessage(message._id));
    Speech.speak(message.body, {
      rate: 1.0,
      onDone: () => { dispatch(setSpeakingMessage(null)); },
      onStopped: () => { dispatch(setSpeakingMessage(null)); },
      onError: () => { dispatch(setSpeakingMessage(null)); },
    });
  };

  const copyMessage = async (body: string) => {
    await Clipboard.setStringAsync(body);
    dispatch(showToast({ variant: 'success', message: 'Copied', durationMs: 1500 }));
  };

  const startEdit = (message: ChatMessage) => {
    setEditingMessageId(message._id);
    setEditingText(message.body);
  };

  const cancelEdit = () => {
    setEditingMessageId(null);
    setEditingText('');
  };

  const submitEdit = async () => {
    if (!activeConversationId || !editingMessageId || !editingText.trim()) return;
    const messageId = editingMessageId;
    const body = editingText.trim();
    setEditingMessageId(null);
    setEditingText('');
    try {
      await editLunaMessage({ conversationId: activeConversationId, messageId, body }).unwrap();
    } catch {
      dispatch(showToast({ variant: 'error', message: 'Could not update that message.' }));
    }
  };

  const handleRegenerate = async () => {
    if (!activeConversationId) return;
    try {
      await regenerateLunaReply(activeConversationId).unwrap();
    } catch {
      dispatch(showToast({ variant: 'error', message: 'Could not regenerate a reply.' }));
    }
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
  const lastAssistantId = [...messages].reverse().find((m) => m.role === 'assistant')?._id;

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
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <IconButton
              variant="glass"
              size={42}
              icon={<History size={18} color={colors.ink} />}
              onPress={() => setHistoryPanelOpen(true)}
            />
            <IconButton
              variant="glass"
              size={42}
              icon={<AudioLines size={18} color={colors.ink} />}
              onPress={() => dispatch(setVoiceModeActive(true))}
            />
            <IconButton
              variant="glass"
              size={42}
              icon={<ScrollText size={18} color={colors.ink} />}
              onPress={() => navigation.navigate('Insights')}
            />
          </View>
        </Animated.View>

        {speakingMessageId && (
          <Animated.View entering={FadeInDown.springify()} style={{ alignItems: 'center', marginTop: 10 }}>
            <Pressable
              onPress={stopSpeaking}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 6,
                backgroundColor: colors.surface2,
                borderRadius: 999,
                paddingHorizontal: 14,
                paddingVertical: 8,
                borderWidth: 1,
                borderColor: colors.glassBorder,
              }}
            >
              <VolumeX size={14} color={colors.primary400} />
              <Text style={{ color: colors.ink, fontFamily: fontFamily.semibold, fontSize: 12.5 }}>Stop speaking</Text>
            </Pressable>
          </Animated.View>
        )}

        <Animated.View entering={FadeInUp.delay(80).springify()} style={{ marginTop: 14 }}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 20, gap: 8 }}
          >
            {SUGGESTIONS.map((s) => (
              <Chip key={s} label={s} onPress={() => submitText(s)} />
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
            {messages.map((m) => {
              const isEditing = editingMessageId === m._id;
              const isUser = m.role === 'user';
              const canEdit = isUser && m._id !== 'welcome' && !pendingTurn;
              const canRegenerate = !isUser && m._id === lastAssistantId && m._id !== 'welcome' && !pendingTurn;

              return (
                <Animated.View
                  key={m._id}
                  entering={FadeInUp.springify()}
                  style={{ alignItems: isUser ? 'flex-end' : 'flex-start', marginBottom: 14 }}
                >
                  {isEditing ? (
                    <View style={{ maxWidth: '86%', gap: 8 }}>
                      <TextInput
                        multiline
                        autoFocus
                        value={editingText}
                        onChangeText={setEditingText}
                        style={{
                          backgroundColor: colors.glassFillStrong,
                          borderRadius: radii.lg,
                          borderBottomRightRadius: 6,
                          padding: 12,
                          minHeight: 44,
                          color: colors.ink,
                          fontFamily: fontFamily.medium,
                          fontSize: 14.5,
                          lineHeight: 20,
                        }}
                      />
                      <View style={{ flexDirection: 'row', gap: 16, justifyContent: 'flex-end' }}>
                        <Pressable onPress={cancelEdit} hitSlop={8}>
                          <Text style={{ color: colors.inkMuted, fontFamily: fontFamily.semibold, fontSize: 12.5 }}>Cancel</Text>
                        </Pressable>
                        <Pressable onPress={submitEdit} hitSlop={8}>
                          <Text style={{ color: colors.primary400, fontFamily: fontFamily.semibold, fontSize: 12.5 }}>
                            Save & Regenerate
                          </Text>
                        </Pressable>
                      </View>
                    </View>
                  ) : (
                    <>
                      {isUser ? (
                        <UserBubble>
                          {m.body ? (
                            <Text style={{ color: colors.inkOnPrimary, fontFamily: fontFamily.semibold, fontSize: 14.5, lineHeight: 20 }}>
                              {m.body}
                            </Text>
                          ) : null}
                        </UserBubble>
                      ) : (
                        <AssistantBubble speakable speaking={speakingMessageId === m._id} onToggleSpeak={() => toggleSpeak(m)}>
                          <Text style={{ color: colors.ink, fontFamily: fontFamily.medium, fontSize: 14.5, lineHeight: 20 }}>
                            {m.body}
                          </Text>
                        </AssistantBubble>
                      )}
                      {m._id !== 'welcome' && (
                        <View style={{ flexDirection: 'row', gap: 14, marginTop: 4, paddingHorizontal: 4 }}>
                          <Pressable onPress={() => copyMessage(m.body)} hitSlop={8} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                            <Copy size={12} color={colors.inkMuted} />
                            <Text style={{ color: colors.inkMuted, fontFamily: fontFamily.medium, fontSize: 11 }}>Copy</Text>
                          </Pressable>
                          {canEdit && (
                            <Pressable onPress={() => startEdit(m)} hitSlop={8} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                              <Pencil size={12} color={colors.inkMuted} />
                              <Text style={{ color: colors.inkMuted, fontFamily: fontFamily.medium, fontSize: 11 }}>Edit</Text>
                            </Pressable>
                          )}
                          {canRegenerate && (
                            <Pressable onPress={handleRegenerate} hitSlop={8} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                              <RefreshCw size={12} color={colors.inkMuted} />
                              <Text style={{ color: colors.inkMuted, fontFamily: fontFamily.medium, fontSize: 11 }}>Regenerate</Text>
                            </Pressable>
                          )}
                        </View>
                      )}
                    </>
                  )}
                </Animated.View>
              );
            })}

            {pendingTurn && (
              <>
                <Animated.View entering={FadeInUp.springify()} style={{ alignItems: 'flex-end', marginBottom: 14 }}>
                  <UserBubble>
                    {pendingTurn.kind === 'text' ? (
                      <>
                        {pendingTurn.attachments?.length ? (
                          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                            {pendingTurn.attachments.map((a) => (
                              <AttachmentThumb key={a.id} attachment={a} tint="dark" />
                            ))}
                          </View>
                        ) : null}
                        <Text style={{ color: colors.inkOnPrimary, fontFamily: fontFamily.semibold, fontSize: 14.5, lineHeight: 20 }}>
                          {pendingTurn.text}
                        </Text>
                      </>
                    ) : (
                      <Text style={{ color: colors.inkOnPrimary, fontFamily: fontFamily.semibold, fontSize: 14.5, lineHeight: 20 }}>
                        🎤 Voice message
                      </Text>
                    )}
                  </UserBubble>
                </Animated.View>
                <Animated.View entering={FadeInUp.springify()} style={{ flexDirection: 'row', justifyContent: 'flex-start', marginBottom: 14 }}>
                  {pendingTurn.status === 'sending' ? (
                    <AssistantBubble>
                      <TypingDots />
                    </AssistantBubble>
                  ) : (
                    <View style={{ alignItems: 'flex-start', gap: 6 }}>
                      <AssistantBubble>
                        <Text style={{ color: colors.ink, fontFamily: fontFamily.medium, fontSize: 14.5, lineHeight: 20 }}>
                          Sorry, I couldn't reach my brain just now.
                        </Text>
                      </AssistantBubble>
                      <Pressable onPress={retryPending} hitSlop={8} style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 4 }}>
                        <RefreshCw size={12} color={colors.primary400} />
                        <Text style={{ color: colors.primary400, fontFamily: fontFamily.semibold, fontSize: 11.5 }}>Retry</Text>
                      </Pressable>
                    </View>
                  )}
                </Animated.View>
              </>
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
      {voiceModeActive && (
        <VoiceModeOverlay
          conversationId={activeConversationId}
          onConversationStarted={(id) => dispatch(setActiveConversation(id))}
          onExit={() => dispatch(setVoiceModeActive(false))}
        />
      )}
      <ChatHistoryPanel
        visible={historyPanelOpen}
        onClose={() => setHistoryPanelOpen(false)}
        onNewChat={() => {
          handleNewChat();
          setHistoryPanelOpen(false);
        }}
        onSelectConversation={(id) => {
          dispatch(setActiveConversation(id));
          setHistoryPanelOpen(false);
        }}
      />
    </Screen>
  );
}
