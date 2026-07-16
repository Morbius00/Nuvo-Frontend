import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { LunaStackParamList } from './types';
import { AdvisorChatScreen } from '@/features/luna/AdvisorChatScreen';
import { InsightsScreen } from '@/features/luna/InsightsScreen';
import { SavingsOpportunitiesScreen } from '@/features/luna/SavingsOpportunitiesScreen';
import { GoalPlannerScreen } from '@/features/luna/GoalPlannerScreen';
import { GoalDetailScreen } from '@/features/luna/GoalDetailScreen';

const Stack = createNativeStackNavigator<LunaStackParamList>();

export function LunaStackNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="AdvisorChat" component={AdvisorChatScreen} />
      <Stack.Screen name="Insights" component={InsightsScreen} />
      <Stack.Screen name="SavingsOpportunities" component={SavingsOpportunitiesScreen} />
      <Stack.Screen name="GoalPlanner" component={GoalPlannerScreen} />
      <Stack.Screen name="GoalDetail" component={GoalDetailScreen} />
    </Stack.Navigator>
  );
}
