import { View, Text, Image, Pressable, ScrollView } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { FileText, X } from 'lucide-react-native';
import { colors, fontFamily, radii } from '@/theme/tokens';
import { LunaAttachment } from '@/store/slices/lunaSlice';

export function PendingAttachmentStrip({
  attachments,
  onRemove,
}: {
  attachments: LunaAttachment[];
  onRemove: (id: string) => void;
}) {
  if (!attachments.length) return null;

  return (
    <Animated.View entering={FadeIn.duration(160)} exiting={FadeOut.duration(120)}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 10, paddingBottom: 10, paddingTop: 2 }}
      >
        {attachments.map((a) => (
          <View key={a.id} style={{ position: 'relative' }}>
            {a.kind === 'image' ? (
              <Image source={{ uri: a.uri }} style={{ width: 60, height: 60, borderRadius: radii.md, backgroundColor: colors.surface }} />
            ) : (
              <View
                style={{
                  width: 60,
                  height: 60,
                  borderRadius: radii.md,
                  backgroundColor: colors.glassFillStrong,
                  borderWidth: 1,
                  borderColor: colors.glassBorder,
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: 6,
                }}
              >
                <FileText size={18} color={colors.primary400} />
                <Text
                  numberOfLines={1}
                  style={{ color: colors.inkMuted, fontSize: 9, fontFamily: fontFamily.medium, marginTop: 3 }}
                >
                  {a.name ?? 'File'}
                </Text>
              </View>
            )}
            <Pressable
              onPress={() => onRemove(a.id)}
              hitSlop={8}
              style={{
                position: 'absolute',
                top: -6,
                right: -6,
                width: 20,
                height: 20,
                borderRadius: 10,
                backgroundColor: colors.bgRaised,
                alignItems: 'center',
                justifyContent: 'center',
                borderWidth: 1,
                borderColor: colors.glassBorder,
              }}
            >
              <X size={12} color={colors.ink} />
            </Pressable>
          </View>
        ))}
      </ScrollView>
    </Animated.View>
  );
}
