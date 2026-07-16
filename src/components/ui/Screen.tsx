import { ReactNode } from 'react';
import { View, ScrollView, ScrollViewProps, StyleSheet } from 'react-native';
import { SafeAreaView, Edge } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { bgAuroraGreen, bgAuroraLime, bgAuroraLocations, colors } from '@/theme/tokens';
import { cn } from '@/utils/cn';

interface ScreenProps {
  children: ReactNode;
  scroll?: boolean;
  className?: string;
  edges?: Edge[];
  aurora?: boolean;
  /** Extra blob gradient (e.g. bgAuroraCyan) layered on top of the default aurora — opt-in per screen. */
  auroraExtra?: readonly [string, string, string];
  contentContainerClassName?: string;
  scrollProps?: Omit<ScrollViewProps, 'children'>;
}

/** Soft glowing color blobs behind every screen — the "aurora" depth cue from the reference UI. */
function Aurora({ extra }: { extra?: readonly [string, string, string] }) {
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <LinearGradient
        colors={bgAuroraGreen}
        locations={bgAuroraLocations}
        style={[styles.blob, { top: -160, left: -120, width: 420, height: 420 }]}
      />
      <LinearGradient
        colors={bgAuroraLime}
        locations={bgAuroraLocations}
        style={[styles.blob, { top: 160, right: -140, width: 360, height: 360 }]}
      />
      {extra && (
        <LinearGradient
          colors={extra}
          locations={bgAuroraLocations}
          style={[styles.blob, { top: 420, left: -100, width: 340, height: 340 }]}
        />
      )}
    </View>
  );
}

export function Screen({
  children,
  scroll,
  className,
  edges = ['top', 'left', 'right'],
  aurora = true,
  auroraExtra,
  contentContainerClassName,
  scrollProps,
}: ScreenProps) {
  return (
    <SafeAreaView edges={edges} className={cn('flex-1 bg-bg', className)} style={{ backgroundColor: colors.bg }}>
      <StatusBar style="light" />
      {aurora && <Aurora extra={auroraExtra} />}
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
