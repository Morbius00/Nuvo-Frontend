import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AnalyticsStackParamList } from './types';
import { AnalyticsDashboardScreen } from '@/features/analytics/AnalyticsDashboardScreen';
import { MonthlyReportScreen } from '@/features/analytics/MonthlyReportScreen';
import { CategoryDrilldownScreen } from '@/features/analytics/CategoryDrilldownScreen';
import { YearInReviewScreen } from '@/features/analytics/YearInReviewScreen';
import { CashFlowScreen } from '@/features/analytics/CashFlowScreen';

const Stack = createNativeStackNavigator<AnalyticsStackParamList>();

export function AnalyticsStackNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="AnalyticsDashboard" component={AnalyticsDashboardScreen} />
      <Stack.Screen name="MonthlyReport" component={MonthlyReportScreen} />
      <Stack.Screen name="CategoryDrilldown" component={CategoryDrilldownScreen} />
      <Stack.Screen name="YearInReview" component={YearInReviewScreen} />
      <Stack.Screen name="CashFlow" component={CashFlowScreen} />
    </Stack.Navigator>
  );
}
