import type { NavigatorScreenParams } from '@react-navigation/native';

export type AuthStackParamList = {
  Welcome: undefined;
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
};

export type OnboardingStackParamList = {
  Onboarding: undefined;
  BiometricSetup: undefined;
};

export type HomeStackParamList = {
  Home: undefined;
  SpendHealth: undefined;
};

export type TransactionsStackParamList = {
  TransactionList: undefined;
  TransactionDetail: { id: string };
  AddTransaction: { prefill?: { type?: 'expense' | 'income' } } | undefined;
  UpiImport: undefined;
};

export type AnalyticsStackParamList = {
  AnalyticsDashboard: undefined;
  MonthlyReport: undefined;
  CategoryDrilldown: { category: string };
  YearInReview: undefined;
  CashFlow: undefined;
};

export type LunaStackParamList = {
  AdvisorChat: undefined;
  Insights: undefined;
  SavingsOpportunities: undefined;
  GoalPlanner: undefined;
  GoalDetail: { id: string };
};

export type MainTabParamList = {
  HomeTab: NavigatorScreenParams<HomeStackParamList>;
  TransactionsTab: NavigatorScreenParams<TransactionsStackParamList>;
  ScanTab: undefined;
  AnalyticsTab: NavigatorScreenParams<AnalyticsStackParamList>;
  LunaTab: NavigatorScreenParams<LunaStackParamList>;
};

export type RootStackParamList = {
  Auth: NavigatorScreenParams<AuthStackParamList>;
  OnboardingFlow: NavigatorScreenParams<OnboardingStackParamList>;
  Main: NavigatorScreenParams<MainTabParamList>;
  ScanReceipt: undefined;
  TransactionConfirm: { transactionId: string; jobId?: string };
  AlertDetail: {
    tier: 'yellow' | 'orange' | 'red' | 'hard' | 'predictive';
    forecast?: { recommendedDailyTarget: number; projectedBreachDate?: string };
  };
  Notifications: undefined;
  Settings: undefined;
  Profile: undefined;
  Security: undefined;
  StopLossSettings: undefined;
  Subscriptions: undefined;
  ComingSoon: { title: string; description: string };
};

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
