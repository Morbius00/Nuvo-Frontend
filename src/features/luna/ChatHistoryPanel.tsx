import { View, Text, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeOut, SlideInLeft, SlideOutLeft, FadeInUp, Easing } from 'react-native-reanimated';
import { X, SquarePen, MessageSquare, Trash2 } from 'lucide-react-native';
import { GlassCard } from '@/components/ui/GlassCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import { colors, fontFamily } from '@/theme/tokens';
import { groupByDay } from '@/utils/format';
import { useGetLunaConversationsQuery, useDeleteLunaConversationMutation } from '@/store/api/aiApi';

interface ChatHistoryPanelProps {
  visible: boolean;
  onClose: () => void;
  onNewChat: () => void;
  onSelectConversation: (id: string) => void;
}

/** Panel sliding in from the left, a little wider than half the screen — history + "New chat"
 * live together here, freeing up the header for the speech-to-speech toggle. */
export function ChatHistoryPanel({ visible, onClose, onNewChat, onSelectConversation }: ChatHistoryPanelProps) {
  const insets = useSafeAreaInsets();
  const { data: conversations, isLoading } = useGetLunaConversationsQuery(undefined, { skip: !visible });
  const [deleteConversation] = useDeleteLunaConversationMutation();

  if (!visible) return null;

  const handleDelete = (id: string) => {
    deleteConversation(id).catch(() => {});
  };

  const sections = groupByDay(conversations ?? [], (c) => c.lastMessageAt);

  return (
    <>
      <Animated.View
        entering={FadeIn.duration(180)}
        exiting={FadeOut.duration(150)}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 90 }}
      >
        <Pressable style={{ flex: 1 }} onPress={onClose} />
      </Animated.View>

      <Animated.View
        entering={SlideInLeft.duration(280).easing(Easing.out(Easing.cubic))}
        exiting={SlideOutLeft.duration(240).easing(Easing.in(Easing.cubic))}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          bottom: 0,
          width: '67%',
          backgroundColor: colors.bgRaised,
          borderRightWidth: 1,
          borderRightColor: colors.glassBorder,
          zIndex: 91,
          paddingTop: insets.top + 12,
          paddingBottom: insets.bottom + 12,
        }}
      >
        <View style={{ paddingHorizontal: 14, gap: 16, flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text style={{ color: colors.ink, fontFamily: fontFamily.extrabold, fontSize: 17 }}>Chat History</Text>
            <Pressable
              onPress={onClose}
              hitSlop={10}
              style={{
                width: 32,
                height: 32,
                borderRadius: 16,
                backgroundColor: colors.glassFillStrong,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <X size={16} color={colors.ink} />
            </Pressable>
          </View>

          <Pressable
            onPress={onNewChat}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 10,
              backgroundColor: colors.primary500,
              borderRadius: 14,
              paddingVertical: 12,
              paddingHorizontal: 14,
            }}
          >
            <SquarePen size={17} color={colors.inkOnPrimary} />
            <Text style={{ color: colors.inkOnPrimary, fontFamily: fontFamily.bold, fontSize: 13.5 }}>New Chat</Text>
          </Pressable>

          <Animated.ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 16, paddingBottom: 20 }}>
            {isLoading ? (
              <View style={{ gap: 10 }}>
                {[0, 1, 2].map((i) => (
                  <Skeleton key={i} height={54} radius={14} />
                ))}
              </View>
            ) : !conversations?.length ? (
              <EmptyState
                icon={<MessageSquare size={24} color={colors.inkMuted} />}
                title="No conversations yet"
                subtitle="Start chatting with LUNA."
              />
            ) : (
              sections.map((section, sIdx) => (
                <Animated.View key={section.title} entering={FadeInUp.delay(sIdx * 30).springify()} style={{ gap: 8 }}>
                  <Text
                    style={{
                      color: colors.inkMuted,
                      fontFamily: fontFamily.bold,
                      fontSize: 10.5,
                      letterSpacing: 0.6,
                      textTransform: 'uppercase',
                    }}
                  >
                    {section.title}
                  </Text>
                  <GlassCard>
                    <View style={{ paddingHorizontal: 2 }}>
                      {section.data.map((c, idx) => (
                        <View key={c._id} style={idx > 0 ? { borderTopWidth: 1, borderTopColor: colors.hairline } : undefined}>
                          <Pressable
                            onPress={() => onSelectConversation(c._id)}
                            style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 11, paddingHorizontal: 10 }}
                          >
                            <View style={{ flex: 1 }}>
                              <Text numberOfLines={1} style={{ color: colors.ink, fontFamily: fontFamily.semibold, fontSize: 12.5 }}>
                                {c.title}
                              </Text>
                              <Text style={{ color: colors.inkMuted, fontFamily: fontFamily.medium, fontSize: 10.5, marginTop: 1 }}>
                                {c.messageCount} messages
                              </Text>
                            </View>
                            <Pressable onPress={() => handleDelete(c._id)} hitSlop={10} style={{ padding: 4 }}>
                              <Trash2 size={14} color={colors.danger400} />
                            </Pressable>
                          </Pressable>
                        </View>
                      ))}
                    </View>
                  </GlassCard>
                </Animated.View>
              ))
            )}
          </Animated.ScrollView>
        </View>
      </Animated.View>
    </>
  );
}
