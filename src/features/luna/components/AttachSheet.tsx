import { forwardRef, ReactNode } from 'react';
import { View, Text, Pressable } from 'react-native';
import { BottomSheetModal } from '@gorhom/bottom-sheet';
import { Image as ImageIcon, FileText, ChevronRight } from 'lucide-react-native';
import { GlassBottomSheet } from '@/components/ui/GlassBottomSheet';
import { colors, fontFamily, radii } from '@/theme/tokens';

interface AttachSheetProps {
  onPickPhoto: () => void;
  onPickDocument: () => void;
}

function OptionRow({
  icon,
  label,
  subtitle,
  onPress,
}: {
  icon: ReactNode;
  label: string;
  subtitle: string;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={{ flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 12 }}>
      <View
        style={{
          width: 44,
          height: 44,
          borderRadius: radii.md,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: colors.glassFillStrong,
          borderWidth: 1,
          borderColor: colors.glassBorder,
        }}
      >
        {icon}
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ color: colors.ink, fontFamily: fontFamily.semibold, fontSize: 15 }}>{label}</Text>
        <Text style={{ color: colors.inkMuted, fontFamily: fontFamily.medium, fontSize: 12, marginTop: 1 }}>
          {subtitle}
        </Text>
      </View>
      <ChevronRight size={18} color={colors.inkMuted} />
    </Pressable>
  );
}

export const AttachSheet = forwardRef<BottomSheetModal, AttachSheetProps>(({ onPickPhoto, onPickDocument }, ref) => {
  return (
    <GlassBottomSheet ref={ref}>
      <View style={{ gap: 2, paddingTop: 8 }}>
        <Text style={{ color: colors.ink, fontFamily: fontFamily.bold, fontSize: 17, marginBottom: 6 }}>
          Attach to LUNA
        </Text>
        <OptionRow
          icon={<ImageIcon size={20} color={colors.primary400} />}
          label="Photo Library"
          subtitle="Share a screenshot or receipt photo"
          onPress={onPickPhoto}
        />
        <View style={{ height: 1, backgroundColor: colors.hairline }} />
        <OptionRow
          icon={<FileText size={20} color={colors.primary400} />}
          label="Document"
          subtitle="PDF, spreadsheet, or any file"
          onPress={onPickDocument}
        />
      </View>
    </GlassBottomSheet>
  );
});
AttachSheet.displayName = 'AttachSheet';
