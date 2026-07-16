import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootStackParamList } from './types';
import { nuvoNavigationTheme } from './navigationTheme';
import { useAppSelector } from '@/store/hooks';
import { AuthStackNavigator } from './AuthStackNavigator';
import { OnboardingStackNavigator } from './OnboardingStackNavigator';
import { MainTabNavigator } from './MainTabNavigator';
import { ScanReceiptScreen } from '@/features/scan/ScanReceiptScreen';
import { TransactionConfirmScreen } from '@/features/scan/TransactionConfirmScreen';
import { AlertDetailScreen } from '@/features/alerts/AlertDetailScreen';
import { NotificationCenterScreen } from '@/features/settings/NotificationCenterScreen';
import { SettingsScreen } from '@/features/settings/SettingsScreen';
import { ProfileScreen } from '@/features/settings/ProfileScreen';
import { SecurityScreen } from '@/features/settings/SecurityScreen';
import { StopLossSettingsScreen } from '@/features/settings/StopLossSettingsScreen';
import { SubscriptionsScreen } from '@/features/settings/SubscriptionsScreen';
import { ComingSoonScreen } from '@/features/settings/ComingSoonScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

// TEMP: verification-only deep-linking config, removed after simulator QA pass.
const verificationLinking = {
  prefixes: ['nuvo://', 'exp://127.0.0.1:8081/--'],
  config: {
    screens: {
      Main: {
        screens: {
          TransactionsTab: { screens: { TransactionList: 'transactions' } },
        },
      },
    },
  },
} as unknown as Parameters<typeof NavigationContainer>[0]['linking'];

export function RootNavigator() {
  const isAuthenticated = useAppSelector((s) => !!s.auth.accessToken);
  const hasCompletedOnboarding = useAppSelector((s) => s.auth.hasCompletedOnboarding);

  return (
    <NavigationContainer theme={nuvoNavigationTheme} linking={verificationLinking}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!isAuthenticated ? (
          <Stack.Screen name="Auth" component={AuthStackNavigator} />
        ) : !hasCompletedOnboarding ? (
          <Stack.Screen name="OnboardingFlow" component={OnboardingStackNavigator} />
        ) : (
          <Stack.Group>
            <Stack.Screen name="Main" component={MainTabNavigator} />
            <Stack.Group screenOptions={{ presentation: 'modal' }}>
              <Stack.Screen name="ScanReceipt" component={ScanReceiptScreen} />
              <Stack.Screen name="TransactionConfirm" component={TransactionConfirmScreen} />
              <Stack.Screen name="AlertDetail" component={AlertDetailScreen} />
              <Stack.Screen name="Notifications" component={NotificationCenterScreen} />
              <Stack.Screen name="Settings" component={SettingsScreen} />
              <Stack.Screen name="Profile" component={ProfileScreen} />
              <Stack.Screen name="Security" component={SecurityScreen} />
              <Stack.Screen name="StopLossSettings" component={StopLossSettingsScreen} />
              <Stack.Screen name="Subscriptions" component={SubscriptionsScreen} />
              <Stack.Screen name="ComingSoon" component={ComingSoonScreen} />
            </Stack.Group>
          </Stack.Group>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
