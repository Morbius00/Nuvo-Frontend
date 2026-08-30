/**
 * Mirrors Nuvo-Backend/src/models/*.ts field-for-field so RTK Query typings are
 * contract-accurate against the real API from day one (see plan §context).
 */

export type RiskTolerance = 'low' | 'medium' | 'high';

export interface User {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  currency: string;
  monthlyBudget: number;
  stopLossAmount: number;
  stopLossAlertPct: number;
  aiProfile: {
    riskTolerance: RiskTolerance;
    spendingPersona?: string;
    financialGoals: string[];
  };
  isPremium: boolean;
  avatarUrl?: string;
  quietHours?: { start: string; end: string };
  oauthProvider?: 'google' | 'apple';
  createdAt: string;
  updatedAt: string;
  __v?: number;
}

export type TransactionType = 'expense' | 'income' | 'transfer';
export type PaymentMethod = 'UPI' | 'card' | 'cash' | 'netbanking' | 'cheque' | 'other';
export type TransactionStatus = 'pending' | 'confirmed' | 'rejected';

export interface OcrLineItem {
  name: string;
  qty?: number;
  unitPrice?: number;
  totalPrice?: number;
}

export interface Transaction {
  _id: string;
  userId: string;
  type: TransactionType;
  amount: number;
  currency: string;
  category: string;
  merchant?: string;
  paymentMethod?: PaymentMethod;
  upiRefId?: string;
  receiptUrl?: string;
  ocrData?: {
    rawText?: string;
    confidence?: number;
    items: OcrLineItem[];
    taxAmount: number;
  };
  aiCategorized: boolean;
  isAnomalous: boolean;
  anomalyScore?: number;
  status: TransactionStatus;
  tags: string[];
  notes?: string;
  description?: string;
  transactionAt: string;
  createdAt: string;
  updatedAt: string;
  __v?: number;
}

export type BudgetPeriod = 'monthly' | 'weekly' | 'yearly';

export interface CategoryBreakdown {
  category: string;
  budget: number;
  spent: number;
  stopLossLimit?: number;
}

export interface Budget {
  _id: string;
  userId: string;
  period: BudgetPeriod;
  year: number;
  month?: number;
  totalBudget: number;
  totalSpent: number;
  totalIncome: number;
  stopLoss: {
    isActive: boolean;
    limit: number;
    alertAt: number;
    hardStop: boolean;
    triggered: boolean;
  };
  categoryBreakdown: CategoryBreakdown[];
  createdAt: string;
  updatedAt: string;
  /** Only present on GET /budgets/current — computed server-side, not a stored field. */
  utilisationPct?: number;
  __v?: number;
}

export type GoalStatus = 'on_track' | 'behind' | 'ahead' | 'completed' | 'abandoned';

export interface Goal {
  _id: string;
  userId: string;
  name: string;
  targetAmount: number;
  savedAmount: number;
  targetDate: string;
  category?: string;
  aiPlan?: {
    requiredMonthlySavings: number;
    projectedCompletionDate?: string;
    recommendations: string[];
  };
  status: GoalStatus;
  createdAt: string;
  updatedAt: string;
  __v?: number;
}

export type InsightType =
  | 'weekly_digest'
  | 'savings_opportunity'
  | 'anomaly_explanation'
  | 'goal_coaching'
  | 'subscription_audit'
  | 'tax_optimisation'
  | 'predictive_warning';

export interface AiInsight {
  _id: string;
  userId: string;
  type: InsightType;
  title: string;
  body: string;
  confidence: number;
  metadata?: Record<string, unknown>;
  isRead: boolean;
  expiresAt?: string;
  createdAt: string;
  __v?: number;
}

export type SubscriptionFrequency = 'weekly' | 'monthly' | 'quarterly' | 'yearly';

export interface Subscription {
  _id: string;
  userId: string;
  name: string;
  amount: number;
  frequency: SubscriptionFrequency;
  nextDueDate?: string;
  lastChargedAmount?: number;
  isAiDetected: boolean;
  isActive: boolean;
  category?: string;
  createdAt: string;
  updatedAt: string;
  __v?: number;
}

export interface HealthScoreComponents {
  budgetAdherence: number;
  savingsRate: number;
  debtManagement: number;
  spendingDiversity: number;
  goalProgress: number;
}

export interface HealthScore {
  _id: string;
  userId: string;
  score: number;
  components: HealthScoreComponents;
  date: string;
  __v?: number;
}

export type NotificationChannel = 'push' | 'email' | 'in_app' | 'sms';
export type NotificationPriority = 'P0' | 'P1' | 'P2' | 'P3';

export interface AppNotification {
  _id: string;
  userId: string;
  type: string;
  title: string;
  body: string;
  priority: NotificationPriority;
  channel: NotificationChannel;
  isRead: boolean;
  sentAt?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
  __v?: number;
}

/** Standard NUVO API response envelope (spec §13 / apiResponse.ts). */
export interface ApiEnvelope<T> {
  success: boolean;
  data: T;
  message?: string;
  errors?: { field: string; message: string }[];
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AnalyticsSummary {
  income: number;
  expense: number;
  savings: number;
  /** Backend only computes an expense-vs-prior-period delta today. */
  incomeDelta?: number;
  expenseDelta: number;
  savingsDelta?: number;
  periodLabel: string;
}

export interface CategoryAnalytics {
  category: string;
  amount: number;
  count: number;
  pctOfTotal: number;
  /** Joined client-side from GET /budgets/current — 0 if the category has no budget set. */
  budgeted: number;
  /** Not provided by the backend; unused by any screen today. */
  priorPeriodDelta?: number;
}

export interface TrendPoint {
  date: string;
  amount: number;
  priorPeriodAmount?: number;
}

export interface ConversationSummary {
  _id: string;
  title: string;
  lastMessageAt: string;
  messageCount: number;
}

export type ChatRole = 'user' | 'assistant';
export type ChatInputMode = 'text' | 'voice';

export interface ChatMessage {
  _id: string;
  conversationId: string;
  role: ChatRole;
  body: string;
  inputMode: ChatInputMode;
  createdAt: string;
}
