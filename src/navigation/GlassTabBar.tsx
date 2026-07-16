import { View, Pressable, StyleSheet, Image } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Home, Receipt, ScanLine, BarChart3 } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { colors, primaryGradient, shadow } from '@/theme/tokens';
import { LiquidGlassSurface } from '@/components/ui/LiquidGlassSurface';

const ICONS: Record<string, typeof Home> = {
  HomeTab: Home,
  TransactionsTab: Receipt,
  AnalyticsTab: BarChart3,
};

const LUNA_AVATAR = require('../../assets/luna-profile-pic.png');

function TabIcon({ focused, name }: { focused: boolean; name: string }) {
  const style = useAnimatedStyle(() => ({
    transform: [{ translateY: withSpring(focused ? -2 : 0, { damping: 14 }) }],
  }));

  if (name === 'LunaTab') {
    return (
      <Animated.View style={[style, { alignItems: 'center', gap: 4 }]}>
        <Image
          source={LUNA_AVATAR}
          style={{
            width: 26,
            height: 26,
            borderRadius: 13,
            opacity: focused ? 1 : 0.5,
            borderWidth: focused ? 1.5 : 0,
            borderColor: colors.primary400,
          }}
        />
        {focused && (
          <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: colors.primary400 }} />
        )}
      </Animated.View>
    );
  }

  const Icon = ICONS[name];
  return (
    <Animated.View style={[style, { alignItems: 'center', justifyContent: 'center', gap: 4 }]}>
      <Icon size={22} color={focused ? colors.primary400 : colors.inkMuted} strokeWidth={focused ? 2.4 : 2} />
      {focused && (
        <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: colors.primary400 }} />
      )}
    </Animated.View>
  );
}

export function GlassTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();

  const handleScanPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    navigation.getParent()?.navigate('ScanReceipt');
  };

  return (
    <View style={[styles.wrapper, { bottom: Math.max(insets.bottom, 14) }]} pointerEvents="box-none">
      {/* Glass bar — scan slot is a transparent spacer so layout stays balanced */}
      <View style={[styles.bar, shadow.card]}>
        <LiquidGlassSurface
          radius={34}
          borderWidth={1.5}
          intensity={55}
          fill="rgba(20,22,27,0.55)"
          outerStyle={{ flex: 1 }}
          contentStyle={styles.barContent}
        >
          {state.routes.map((route, index) => {
            const { options } = descriptors[route.key];
            const focused = state.index === index;

            if (route.name === 'ScanTab') {
              // Spacer only — real button lives outside overflow:hidden below
              return <View key={route.key} style={styles.scanSlot} />;
            }

            const onPress = () => {
              const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
              if (!focused && !event.defaultPrevented) {
                Haptics.selectionAsync().catch(() => {});
                navigation.navigate(route.name);
              }
            };

            return (
              <Pressable
                key={route.key}
                accessibilityRole="button"
                accessibilityState={focused ? { selected: true } : {}}
                accessibilityLabel={options.tabBarAccessibilityLabel}
                onPress={onPress}
                style={styles.tabSlot}
              >
                <TabIcon focused={focused} name={route.name} />
              </Pressable>
            );
          })}
        </LiquidGlassSurface>
      </View>

      {/* Scan button — outside overflow:hidden so it floats above the bar uncropped */}
      <Pressable onPress={handleScanPress} style={styles.scanFloat} pointerEvents="auto">
        <LinearGradient colors={primaryGradient} style={[styles.scanButton, shadow.glow(colors.primary500)]}>
          <ScanLine size={24} color={colors.inkOnPrimary} strokeWidth={2.4} />
        </LinearGradient>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: 20,
    right: 20,
    alignItems: 'center',
  },
  bar: {
    width: '100%',
    height: 68,
  },
  barContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
  },
  tabSlot: {
    flex: 1,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanSlot: {
    width: 62,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanFloat: {
    position: 'absolute',
    bottom: 18,          // centres the 52px button so it straddles the top edge of the 68px bar
    alignSelf: 'center',
    zIndex: 10,
  },
  scanButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
