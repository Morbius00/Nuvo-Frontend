import { useEffect, useState } from 'react';
import { View, Text, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Animated, { FadeInDown, FadeInUp, ZoomIn } from 'react-native-reanimated';
import { X, Shield, TrendingUp, Rocket } from 'lucide-react-native';
import { Screen } from '@/components/ui/Screen';
import { GlassCard } from '@/components/ui/GlassCard';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { IconButton } from '@/components/ui/IconButton';
import { Input } from '@/components/ui/Input';
import { colors, fontFamily } from '@/theme/tokens';
import { RootStackParamList } from '@/navigation/types';
import { useAppSelector } from '@/store/hooks';
import { useUpdateProfileMutation } from '@/store/api/authApi';
import { RiskTolerance } from '@/types';

type Nav = NativeStackNavigationProp<RootStackParamList, 'Profile'>;

const RISK_OPTIONS: { key: RiskTolerance; label: string; icon: typeof Shield }[] = [
  { key: 'low', label: 'Low', icon: Shield },
  { key: 'medium', label: 'Medium', icon: TrendingUp },
  { key: 'high', label: 'High', icon: Rocket },
];

export function ProfileScreen() {
  const navigation = useNavigation<Nav>();
  const user = useAppSelector((s) => s.auth.user);
  const [updateProfile, { isLoading }] = useUpdateProfileMutation();

  const [name, setName] = useState(user?.name ?? '');
  const [currency, setCurrency] = useState(user?.currency ?? 'INR');
  const [risk, setRisk] = useState<RiskTolerance>(user?.aiProfile.riskTolerance ?? 'medium');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name);
      setCurrency(user.currency);
      setRisk(user.aiProfile.riskTolerance);
    }
  }, [user]);

  const onSave = async () => {
    await updateProfile({
      name,
      currency,
      aiProfile: user ? { ...user.aiProfile, riskTolerance: risk } : { riskTolerance: risk, financialGoals: [] },
    })
      .unwrap()
      .catch(() => undefined);
    setSaved(true);
    setTimeout(() => setSaved(false), 1800);
  };

  return (
    <Screen scroll>
      <View style={{ paddingHorizontal: 20, paddingTop: 4, gap: 22 }}>
        <Animated.View
          entering={FadeInDown.springify()}
          style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
        >
          <Text style={{ color: colors.ink, fontFamily: fontFamily.extrabold, fontSize: 22 }}>Profile</Text>
          <IconButton variant="glass" size={40} icon={<X size={18} color={colors.ink} />} onPress={() => navigation.goBack()} />
        </Animated.View>

        <Animated.View entering={ZoomIn.springify().delay(60)} style={{ alignItems: 'center' }}>
          <Image
            source={require('../../../assets/Profile-Image.png')}
            style={{ width: 88, height: 88, borderRadius: 44 }}
          />
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(100).springify()} style={{ gap: 14 }}>
          <Input label="Name" value={name} onChangeText={setName} placeholder="Your name" />
          <Input label="Email" value={user?.email ?? ''} editable={false} style={{ opacity: 0.6 }} />
          <Input label="Currency" value={currency} onChangeText={setCurrency} placeholder="INR" autoCapitalize="characters" maxLength={3} />
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(150).springify()} style={{ gap: 10 }}>
          <Text style={{ color: colors.inkSecondary, fontFamily: fontFamily.semibold, fontSize: 13 }}>Risk Tolerance</Text>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            {RISK_OPTIONS.map((opt) => {
              const Icon = opt.icon;
              const selected = risk === opt.key;
              return (
                <GlassCard
                  key={opt.key}
                  onPress={() => setRisk(opt.key)}
                  style={[{ flex: 1 }, selected ? { borderColor: colors.primary500 } : undefined]}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, paddingVertical: 13, paddingHorizontal: 8 }}>
                    <Icon size={16} color={selected ? colors.primary400 : colors.inkSecondary} />
                    <Text
                      style={{
                        color: selected ? colors.ink : colors.inkSecondary,
                        fontFamily: selected ? fontFamily.bold : fontFamily.semibold,
                        fontSize: 13,
                      }}
                    >
                      {opt.label}
                    </Text>
                  </View>
                </GlassCard>
              );
            })}
          </View>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(200).springify()} style={{ marginTop: 4 }}>
          <PrimaryButton label={saved ? 'Saved' : 'Save Changes'} loading={isLoading} onPress={onSave} />
        </Animated.View>
      </View>
    </Screen>
  );
}
