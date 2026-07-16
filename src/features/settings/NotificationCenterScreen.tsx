import { View, Text, Pressable } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { X, BellOff } from 'lucide-react-native';
import { Screen } from '@/components/ui/Screen';
import { GlassCard } from '@/components/ui/GlassCard';
import { IconButton } from '@/components/ui/IconButton';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { colors, fontFamily, radii } from '@/theme/tokens';
import { relativeDayLabel, formatTime } from '@/utils/format';
import { RootStackParamList } from '@/navigation/types';
import { NotificationPriority } from '@/types';
import {
  useListNotificationsQuery,
  useMarkNotificationReadMutation,
  useMarkAllNotificationsReadMutation,
} from '@/store/api/notificationsApi';

type Nav = NativeStackNavigationProp<RootStackParamList, 'Notifications'>;

const PRIORITY_COLOR: Record<NotificationPriority, string> = {
  P0: colors.danger500,
  P1: colors.tierOrange,
  P2: colors.tierYellow,
  P3: colors.inkMuted,
};

export function NotificationCenterScreen() {
  const navigation = useNavigation<Nav>();
  const { data: notifications, isLoading } = useListNotificationsQuery();
  const [markRead] = useMarkNotificationReadMutation();
  const [markAllRead] = useMarkAllNotificationsReadMutation();

  const unreadCount = notifications?.filter((n) => !n.isRead).length ?? 0;

  return (
    <Screen scroll>
      <View style={{ paddingHorizontal: 20, paddingTop: 4, gap: 18 }}>
        <Animated.View
          entering={FadeInDown.springify()}
          style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
        >
          <View>
            <Text style={{ color: colors.ink, fontFamily: fontFamily.extrabold, fontSize: 22 }}>Notifications</Text>
            {unreadCount > 0 && (
              <Text style={{ color: colors.inkMuted, fontFamily: fontFamily.medium, fontSize: 12.5, marginTop: 2 }}>
                {unreadCount} unread
              </Text>
            )}
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
            {unreadCount > 0 && (
              <Pressable onPress={() => markAllRead()}>
                <Text style={{ color: colors.primary400, fontFamily: fontFamily.semibold, fontSize: 13 }}>Mark all read</Text>
              </Pressable>
            )}
            <IconButton variant="glass" size={40} icon={<X size={18} color={colors.ink} />} onPress={() => navigation.goBack()} />
          </View>
        </Animated.View>

        {isLoading || !notifications ? (
          <View style={{ gap: 10 }}>
            <Skeleton height={72} radius={radii.lg} />
            <Skeleton height={72} radius={radii.lg} />
            <Skeleton height={72} radius={radii.lg} />
          </View>
        ) : notifications.length === 0 ? (
          <EmptyState
            icon={<BellOff size={30} color={colors.inkMuted} />}
            title="You're all caught up"
            subtitle="New alerts and LUNA insights will show up here."
          />
        ) : (
          <View style={{ gap: 10 }}>
            {notifications.map((n, idx) => (
              <Animated.View key={n._id} entering={FadeInUp.delay(60 + idx * 30).springify()}>
                <GlassCard
                  bordered={false}
                  onPress={() => !n.isRead && markRead(n._id)}
                  style={!n.isRead ? { backgroundColor: colors.glassFillStrong } : undefined}
                >
                  <View style={{ flexDirection: 'row' }}>
                    <View style={{ width: 4, backgroundColor: PRIORITY_COLOR[n.priority] }} />
                    <View style={{ flex: 1, padding: 14, gap: 4 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        {!n.isRead && (
                          <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: colors.primary500 }} />
                        )}
                        <Text
                          style={{ color: colors.ink, fontFamily: fontFamily.bold, fontSize: 14.5, flex: 1 }}
                          numberOfLines={1}
                        >
                          {n.title}
                        </Text>
                      </View>
                      <Text style={{ color: colors.inkSecondary, fontFamily: fontFamily.medium, fontSize: 12.5, lineHeight: 18 }} numberOfLines={2}>
                        {n.body}
                      </Text>
                      <Text style={{ color: colors.inkMuted, fontFamily: fontFamily.medium, fontSize: 11, marginTop: 2 }}>
                        {relativeDayLabel(n.createdAt)} · {formatTime(n.createdAt)}
                      </Text>
                    </View>
                  </View>
                </GlassCard>
              </Animated.View>
            ))}
          </View>
        )}
      </View>
    </Screen>
  );
}
