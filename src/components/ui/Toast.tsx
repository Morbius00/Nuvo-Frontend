import { useEffect } from 'react';
import { View, Text, Pressable } from 'react-native';
import Animated, { FadeInDown, FadeOutUp } from 'react-native-reanimated';
import { AlertTriangle, CheckCircle2, Info, XCircle } from 'lucide-react-native';
import { colors, radii, fontFamily } from '@/theme/tokens';
import { LiquidGlassSurface } from './LiquidGlassSurface';
import { ToastItem } from '@/store/slices/toastSlice';

const DEFAULT_DURATION_MS = 3500;

const VARIANT_STYLES: Record<ToastItem['variant'], { color: string; Icon: typeof Info }> = {
  error: { color: colors.danger500, Icon: XCircle },
  warning: { color: colors.tierYellow, Icon: AlertTriangle },
  info: { color: colors.primary400, Icon: Info },
  success: { color: colors.tierGreen, Icon: CheckCircle2 },
};

interface ToastProps {
  toast: ToastItem;
  onDismiss: (id: string) => void;
}

export function Toast({ toast, onDismiss }: ToastProps) {
  const { color, Icon } = VARIANT_STYLES[toast.variant];

  useEffect(() => {
    const timer = setTimeout(() => onDismiss(toast.id), toast.durationMs ?? DEFAULT_DURATION_MS);
    return () => clearTimeout(timer);
  }, [toast.id, toast.durationMs, onDismiss]);

  return (
    <Animated.View entering={FadeInDown.springify()} exiting={FadeOutUp.duration(200)}>
      <Pressable onPress={() => onDismiss(toast.id)}>
        <LiquidGlassSurface
          radius={radii.lg}
          borderWidth={0.8}
          contentStyle={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 10,
            paddingHorizontal: 16,
            paddingVertical: 14,
          }}
        >
          <Icon size={20} color={color} />
          <View style={{ flex: 1 }}>
            <Text style={{ color: colors.ink, fontFamily: fontFamily.semibold, fontSize: 14 }}>{toast.message}</Text>
          </View>
        </LiquidGlassSurface>
      </Pressable>
    </Animated.View>
  );
}
