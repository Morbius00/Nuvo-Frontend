import { View } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MainTabParamList } from './types';
import { GlassTabBar } from './GlassTabBar';
import { HomeStackNavigator } from './HomeStackNavigator';
import { TransactionsStackNavigator } from './TransactionsStackNavigator';
import { AnalyticsStackNavigator } from './AnalyticsStackNavigator';
import { LunaStackNavigator } from './LunaStackNavigator';

const Tab = createBottomTabNavigator<MainTabParamList>();

/** Renders nothing — ScanTab's tabPress is intercepted in GlassTabBar to open the root ScanReceipt modal instead. */
function ScanTabPlaceholder() {
  return <View />;
}

export function MainTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{ headerShown: false }}
      tabBar={(props) => <GlassTabBar {...props} />}
    >
      <Tab.Screen name="HomeTab" component={HomeStackNavigator} />
      <Tab.Screen name="TransactionsTab" component={TransactionsStackNavigator} />
      <Tab.Screen name="ScanTab" component={ScanTabPlaceholder} />
      <Tab.Screen name="AnalyticsTab" component={AnalyticsStackNavigator} />
      <Tab.Screen name="LunaTab" component={LunaStackNavigator} />
    </Tab.Navigator>
  );
}
