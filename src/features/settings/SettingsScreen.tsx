import { ReactNode } from 'react';
import { View, Text } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import {
  X,
  User,
  Lock,
  ShieldAlert,
  Repeat,
  Bell,
  Globe,
  LineChart,
  ReceiptIndianRupee,
  Users,
  LogOut,
  ChevronRight,
  type LucideIcon,
} from 'lucide-react-native';
import { Screen } from '@/components/ui/Screen';
import { GlassCard } from '@/components/ui/GlassCard';
import { GlassButton } from '@/components/ui/GlassButton';
import { IconButton } from '@/components/ui/IconButton';
import { colors, fontFamily } from '@/theme/tokens';
import { RootStackParamList } from '@/navigation/types';
import { useLogoutMutation } from '@/store/api/authApi';

type Nav = NativeStackNavigationProp<RootStackParamList, 'Settings'>;

function SettingsRow({
  icon: Icon,
  label,
  subtitle,
  onPress,
  danger,
}: {
  icon: LucideIcon;
  label: string;
  subtitle?: string;
  onPress: () => void;
  danger?: boolean;
}) {
  return (
    <GlassCard onPress={onPress} bordered={false} style={{ marginBottom: 10 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, padding: 15 }}>
        <View
          style={{
            width: 38,
            height: 38,
            borderRadius: 12,
            backgroundColor: danger ? 'rgba(255,92,92,0.14)' : colors.glassFillStrong,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icon size={18} color={danger ? colors.danger400 : colors.primary400} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ color: danger ? colors.danger400 : colors.ink, fontFamily: fontFamily.semibold, fontSize: 14.5 }}>
            {label}
          </Text>
          {subtitle && (
            <Text style={{ color: colors.inkMuted, fontFamily: fontFamily.medium, fontSize: 11.5, marginTop: 1 }}>
              {subtitle}
            </Text>
          )}
        </View>
        <ChevronRight size={18} color={colors.inkMuted} />
      </View>
    </GlassCard>
  );
}

function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <Text
      style={{
        color: colors.inkMuted,
        fontFamily: fontFamily.bold,
        fontSize: 11.5,
        letterSpacing: 0.6,
        marginBottom: 10,
        marginLeft: 4,
      }}
    >
      {children}
    </Text>
  );
}

export function SettingsScreen() {
  const navigation = useNavigation<Nav>();
  const [logout] = useLogoutMutation();

  const openComingSoon = (title: string, description: string) => navigation.navigate('ComingSoon', { title, description });

  return (
    <Screen scroll>
      <View style={{ paddingHorizontal: 20, paddingTop: 4, gap: 20 }}>
        <Animated.View
          entering={FadeInDown.springify()}
          style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
        >
          <Text style={{ color: colors.ink, fontFamily: fontFamily.extrabold, fontSize: 22 }}>Settings</Text>
          <IconButton variant="glass" size={40} icon={<X size={18} color={colors.ink} />} onPress={() => navigation.goBack()} />
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(60).springify()}>
          <SectionLabel>ACCOUNT</SectionLabel>
          <SettingsRow icon={User} label="Profile" subtitle="Name, currency & risk profile" onPress={() => navigation.navigate('Profile')} />
          <SettingsRow icon={Lock} label="Security" subtitle="Biometric lock & password" onPress={() => navigation.navigate('Security')} />
          <SettingsRow
            icon={ShieldAlert}
            label="Stop-Loss Settings"
            subtitle="Budget limits & alert thresholds"
            onPress={() => navigation.navigate('StopLossSettings')}
          />
          <SettingsRow icon={Repeat} label="Subscriptions" subtitle="AI-detected recurring charges" onPress={() => navigation.navigate('Subscriptions')} />
          <SettingsRow icon={Bell} label="Notifications" subtitle="Alerts & digests" onPress={() => navigation.navigate('Notifications')} />
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(120).springify()}>
          <SectionLabel>MORE</SectionLabel>
          <SettingsRow
            icon={Globe}
            label="Multi-Currency"
            subtitle="Coming soon"
            onPress={() =>
              openComingSoon(
                'Multi-Currency Support',
                'Track and convert transactions across multiple currencies with live exchange rates — built for travellers and cross-border spenders.',
              )
            }
          />
          <SettingsRow
            icon={LineChart}
            label="Investment Integration"
            subtitle="Coming soon"
            onPress={() =>
              openComingSoon(
                'Investment Integration',
                'Link your brokerage and mutual fund accounts so LUNA can show your full net worth alongside your everyday spending.',
              )
            }
          />
          <SettingsRow
            icon={ReceiptIndianRupee}
            label="Tax Prep Assistant"
            subtitle="Coming soon"
            onPress={() =>
              openComingSoon(
                'Tax Prep Assistant',
                'LUNA will auto-categorise deductible expenses throughout the year and generate a tax-ready summary each financial year end.',
              )
            }
          />
          <SettingsRow
            icon={Users}
            label="Peer Benchmarking"
            subtitle="Coming soon"
            onPress={() =>
              openComingSoon(
                'Peer Benchmarking',
                'See anonymised comparisons of your spending against similar households to spot savings opportunities LUNA can act on.',
              )
            }
          />
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(180).springify()} style={{ marginTop: 8 }}>
          <GlassButton label="Log Out" variant="danger" icon={<LogOut size={17} color={colors.danger400} />} onPress={() => logout()} />
        </Animated.View>
      </View>
    </Screen>
  );
}
