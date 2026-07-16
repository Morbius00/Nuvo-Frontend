import { ReactNode, useEffect, useRef, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Platform, KeyboardAvoidingView, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  FadeInDown,
  FadeInUp,
  FadeOutDown,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import { Sparkles, ScrollText, Mic, Send } from 'lucide-react-native';
import { Screen } from '@/components/ui/Screen';
import { IconButton } from '@/components/ui/IconButton';
import { Chip, Badge } from '@/components/ui/Chip';
import { Input } from '@/components/ui/Input';
import { colors, fontFamily, primaryGradient, radii, shadow } from '@/theme/tokens';
import { LunaStackParamList } from '@/navigation/types';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { addMessage, LunaMessage } from '@/store/slices/lunaSlice';
import { useLunaChatMutation } from '@/store/api/aiApi';

type Nav = NativeStackNavigationProp<LunaStackParamList>;

const SUGGESTIONS = ['Spending this month', 'Any savings ideas?', 'Check my goals', 'My subscriptions'];
const VOICE_TRANSCRIPT = 'How much did I spend on food this week?';
const LISTEN_DURATION = 1200;

function AssistantBubble({ children }: { children: ReactNode }) {
  return (
    <View
      style={{
        maxWidth: '82%',
        borderRadius: radii.lg,
        borderBottomLeftRadius: 6,
        overflow: 'hidden',
        borderWidth: StyleSheet.hairlineWidth * 2,
        borderColor: colors.glassBorder,
      }}
    >
      <BlurView
        intensity={40}
        tint="dark"
        experimentalBlurMethod={Platform.OS === 'android' ? 'dimezisBlurView' : undefined}
        style={StyleSheet.absoluteFill}
      />
      <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.glassFill }]} />
      <View style={{ paddingHorizontal: 14, paddingVertical: 11 }}>{children}</View>
    </View>
  );
}

function UserBubble({ children }: { children: ReactNode }) {
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
      }}
    >
      {children}
    </LinearGradient>
  );
}

function TypingDots() {
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

export function AdvisorChatScreen() {
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const dispatch = useAppDispatch();
  const user = useAppSelector((s) => s.auth.user);
  const messages = useAppSelector((s) => s.luna.messages);
  const [chat, { isLoading }] = useLunaChatMutation();

  const [draft, setDraft] = useState('');
  const [listening, setListening] = useState(false);
  const scrollRef = useRef<ScrollView>(null);
  const pulse = useSharedValue(1);
  const micPulseStyle = useAnimatedStyle(() => ({ transform: [{ scale: pulse.value }] }));

  const inputBarBottom = Math.max(insets.bottom, 14) + 68 + 14;

  useEffect(() => {
    const id = setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 80);
    return () => clearTimeout(id);
  }, [messages.length, isLoading]);

  const sendMessage = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    const userMsg: LunaMessage = {
      id: `user_${Date.now()}`,
      role: 'user',
      body: trimmed,
      createdAt: new Date().toISOString(),
    };
    dispatch(addMessage(userMsg));
    setDraft('');
    try {
      const result = await chat({ message: trimmed }).unwrap();
      dispatch(addMessage({ id: result.id, role: 'assistant', body: result.body, createdAt: result.createdAt }));
    } catch {
      dispatch(
        addMessage({
          id: `err_${Date.now()}`,
          role: 'assistant',
          body: "Sorry, I couldn't reach my brain just now — try again in a moment.",
          createdAt: new Date().toISOString(),
        }),
      );
    }
  };

  const onMicPress = () => {
    if (listening) return;
    setListening(true);
    pulse.value = withRepeat(withSequence(withTiming(1.22, { duration: 300 }), withTiming(1, { duration: 300 })), 2, false);
    setTimeout(() => {
      setListening(false);
      sendMessage(VOICE_TRANSCRIPT);
    }, LISTEN_DURATION);
  };

  return (
    <Screen edges={['top', 'left', 'right']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Animated.View
          entering={FadeInDown.springify()}
          style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 4, gap: 12 }}
        >
          <Image
            source={require('../../../assets/luna-profile-pic.png')}
            style={{ width: 46, height: 46, borderRadius: 16, ...shadow.glow(colors.primary500) }}
          />
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
                    <Text style={{ color: colors.inkOnPrimary, fontFamily: fontFamily.semibold, fontSize: 14.5, lineHeight: 20 }}>
                      {m.body}
                    </Text>
                  </UserBubble>
                ) : (
                  <AssistantBubble>
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

          <View style={{ position: 'absolute', left: 20, right: 20, bottom: inputBarBottom }}>
            {listening && (
              <Animated.View
                entering={FadeInDown}
                exiting={FadeOutDown}
                style={{
                  position: 'absolute',
                  bottom: 66,
                  alignSelf: 'center',
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 8,
                  backgroundColor: colors.glassFillStrong,
                  borderWidth: 1,
                  borderColor: colors.glassBorder,
                  paddingHorizontal: 14,
                  paddingVertical: 8,
                  borderRadius: radii.pill,
                }}
              >
                <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primary400 }} />
                <Text style={{ color: colors.ink, fontFamily: fontFamily.semibold, fontSize: 12.5 }}>Listening…</Text>
              </Animated.View>
            )}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <Animated.View style={micPulseStyle}>
                <IconButton
                  variant="glass"
                  size={50}
                  icon={<Mic size={20} color={listening ? colors.primary400 : colors.ink} />}
                  onPress={onMicPress}
                />
              </Animated.View>
              <View style={{ flex: 1 }}>
                <Input
                  value={draft}
                  onChangeText={setDraft}
                  placeholder="Ask LUNA anything…"
                  returnKeyType="send"
                  onSubmitEditing={() => sendMessage(draft)}
                />
              </View>
              <IconButton
                icon={<Send size={19} color={colors.inkOnPrimary} />}
                size={50}
                onPress={() => sendMessage(draft)}
                style={{ opacity: draft.trim() ? 1 : 0.55 }}
              />
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}
