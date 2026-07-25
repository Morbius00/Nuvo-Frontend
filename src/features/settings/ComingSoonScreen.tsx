import { useState } from 'react';
import { View, Text } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Animated, { FadeInDown, FadeInUp, ZoomIn } from 'react-native-reanimated';
import { ArrowLeft, BellRing, Check } from 'lucide-react-native';
import { Screen } from '@/components/ui/Screen';
import { GlassButton } from '@/components/ui/GlassButton';
import { IconButton } from '@/components/ui/IconButton';
import { FloatingImage } from '@/components/ui/FloatingImage';
import { colors, fontFamily } from '@/theme/tokens';
import { RootStackParamList } from '@/navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList, 'ComingSoon'>;
type Rt = RouteProp<RootStackParamList, 'ComingSoon'>;

export function ComingSoonScreen() {
  const navigation = useNavigation<Nav>();
  const { params } = useRoute<Rt>();
  const [notified, setNotified] = useState(false);

  return (
    <Screen>
      <View style={{ paddingHorizontal: 20, paddingTop: 4 }}>
        <IconButton variant="glass" size={40} icon={<ArrowLeft size={18} color={colors.ink} />} onPress={() => navigation.goBack()} />
      </View>

      <View style={{ flex: 1, paddingHorizontal: 32, alignItems: 'center', justifyContent: 'center', gap: 24 }}>
        <Animated.View entering={ZoomIn.springify().delay(60)}>
          <FloatingImage source={require('../../../assets/LUNA-Nothinghere.png')} size={180} />
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(140).springify()} style={{ alignItems: 'center', gap: 10 }}>
          <Text style={{ color: colors.primary400, fontFamily: fontFamily.bold, fontSize: 12, letterSpacing: 0.6 }}>
            COMING SOON
          </Text>
          <Text style={{ color: colors.ink, fontFamily: fontFamily.extrabold, fontSize: 23, textAlign: 'center' }}>
            {params.title}
          </Text>
          <Text
            style={{
              color: colors.inkSecondary,
              fontFamily: fontFamily.medium,
              fontSize: 14,
              textAlign: 'center',
              lineHeight: 21,
              maxWidth: 300,
            }}
          >
            {params.description}
          </Text>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(220).springify()} style={{ width: '100%', gap: 10, marginTop: 8 }}>
          <GlassButton
            label={notified ? "You're on the list" : 'Notify me when available'}
            icon={notified ? <Check size={17} color={colors.ink} /> : <BellRing size={17} color={colors.ink} />}
            onPress={() => setNotified(true)}
          />
        </Animated.View>
      </View>
    </Screen>
  );
}
