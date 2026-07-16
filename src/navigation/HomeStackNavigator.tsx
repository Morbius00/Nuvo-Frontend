import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { HomeStackParamList } from './types';
import { HomeScreen } from '@/features/home/HomeScreen';
import { SpendHealthScreen } from '@/features/home/SpendHealthScreen';

const Stack = createNativeStackNavigator<HomeStackParamList>();

export function HomeStackNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Home" component={HomeScreen} />
      <Stack.Screen name="SpendHealth" component={SpendHealthScreen} />
    </Stack.Navigator>
  );
}
