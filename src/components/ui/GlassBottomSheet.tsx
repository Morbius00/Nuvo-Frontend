import { forwardRef, ReactNode, useCallback } from 'react';
import { StyleSheet, View, Platform } from 'react-native';
import {
  BottomSheetModal,
  BottomSheetView,
  BottomSheetBackdrop,
  BottomSheetBackdropProps,
} from '@gorhom/bottom-sheet';
import { BlurView } from 'expo-blur';
import { colors, liquidGlass } from '@/theme/tokens';

interface GlassBottomSheetProps {
  children: ReactNode;
  snapPoints?: (string | number)[];
  onDismiss?: () => void;
  enableDynamicSizing?: boolean;
}

/**
 * Full-bleed glass background for the sheet — BlurView + a dark fill.
 * Doesn't reuse LiquidGlassSurface's shrink-wrap gradient-border trick since
 * this needs to fill whatever size @gorhom/bottom-sheet gives it.
 */
function GlassBackground() {
  return (
    <View style={StyleSheet.absoluteFill}>
      <BlurView
        intensity={liquidGlass.blurSheet}
        tint="dark"
        experimentalBlurMethod={Platform.OS === 'android' ? 'dimezisBlurView' : undefined}
        style={StyleSheet.absoluteFill}
      />
      <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(10,11,14,0.72)' }]} />
    </View>
  );
}

export const GlassBottomSheet = forwardRef<BottomSheetModal, GlassBottomSheetProps>(
  ({ children, snapPoints, onDismiss, enableDynamicSizing = true }, ref) => {
    const renderBackdrop = useCallback(
      (props: BottomSheetBackdropProps) => (
        <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} opacity={0.6} pressBehavior="close" />
      ),
      [],
    );

    return (
      <BottomSheetModal
        ref={ref}
        snapPoints={snapPoints}
        enableDynamicSizing={enableDynamicSizing && !snapPoints}
        onDismiss={onDismiss}
        backdropComponent={renderBackdrop}
        backgroundComponent={GlassBackground}
        handleIndicatorStyle={{ backgroundColor: colors.glassBorder, width: 40 }}
        style={{ borderRadius: 28, overflow: 'hidden' }}
      >
        <BottomSheetView style={{ paddingHorizontal: 20, paddingBottom: 32, paddingTop: 4 }}>
          {children}
        </BottomSheetView>
      </BottomSheetModal>
    );
  },
);
GlassBottomSheet.displayName = 'GlassBottomSheet';
