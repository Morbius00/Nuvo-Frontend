import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { TransactionsStackParamList } from './types';
import { TransactionListScreen } from '@/features/transactions/TransactionListScreen';
import { TransactionDetailScreen } from '@/features/transactions/TransactionDetailScreen';
import { AddTransactionScreen } from '@/features/transactions/AddTransactionScreen';
import { UpiImportScreen } from '@/features/transactions/UpiImportScreen';

const Stack = createNativeStackNavigator<TransactionsStackParamList>();

export function TransactionsStackNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="TransactionList" component={TransactionListScreen} />
      <Stack.Screen name="TransactionDetail" component={TransactionDetailScreen} />
      <Stack.Screen name="AddTransaction" component={AddTransactionScreen} options={{ presentation: 'modal' }} />
      <Stack.Screen name="UpiImport" component={UpiImportScreen} options={{ presentation: 'modal' }} />
    </Stack.Navigator>
  );
}
