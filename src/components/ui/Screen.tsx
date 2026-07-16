import { ReactNode } from 'react';
import { View, ScrollView, ScrollViewProps, StyleSheet } from 'react-native';
import { SafeAreaView, Edge } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '@/theme/tokens';
import { cn } from '@/utils/cn';

interface ScreenProps {
  children: ReactNode;
  scroll?: boolean;
  className?: string;
  edges?: Edge[];
  aurora?: boolean;
  contentContainerClassName?: string;
  scrollProps?: Omit<ScrollViewProps, 'children'>;
}

/** Soft glowing color blobs behind every screen — the "aurora" depth cue from the reference UI. */
function Aurora() {
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <LinearGradient
        colors={['rgba(34,227,122,0.28)', 'rgba(34,227,122,0)']}
        style={[styles.blob, { top: -140, left: -100, width: 340, height: 340 }]}
      />
      <LinearGradient
        colors={['rgba(182,255,77,0.16)', 'rgba(182,255,77,0)']}
        style={[styles.blob, { top: 180, right: -120, width: 280, height: 280 }]}
      />
    </View>
  );
}

export function Screen({
  children,
  scroll,
  className,
  edges = ['top', 'left', 'right'],
  aurora = true,
  contentContainerClassName,
  scrollProps,
}: ScreenProps) {
  return (
    <SafeAreaView edges={edges} className={cn('flex-1 bg-bg', className)} style={{ backgroundColor: colors.bg }}>
      <StatusBar style="light" />
      {aurora && <Aurora />}
      {scroll ? (
        <ScrollView
          className={contentContainerClassName}
          contentContainerStyle={{ paddingBottom: 130 }}
          showsVerticalScrollIndicator={false}
          {...scrollProps}
        >
          {children}
        </ScrollView>
      ) : (
        children
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  blob: {
    position: 'absolute',
    borderRadius: 999,
  },
});
