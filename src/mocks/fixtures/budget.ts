import { Budget } from '@/types';

const now = new Date();

/**
 * Static config only — totalSpent / totalIncome / categoryBreakdown.spent are
 * computed on read in mockServer.ts from the live transactions store (trailing
 * 30-day window), so edits to transactions immediately affect the gauge.
 */
export const budgetConfig: Omit<Budget, 'totalSpent' | 'totalIncome' | 'categoryBreakdown'> & {
  categoryBudgets: Record<string, number>;
} = {
  _id: 'budget_current',
  userId: 'user_demo_001',
  period: 'monthly',
  year: now.getFullYear(),
  month: now.getMonth() + 1,
  totalBudget: 45000,
  stopLoss: {
    isActive: true,
    limit: 50000,
    alertAt: 80,
    hardStop: false,
    triggered: false,
  },
  categoryBudgets: {
    food_dining: 12000,
    transportation: 8000,
    shopping: 8000,
    entertainment: 2500,
    health_wellness: 4000,
    utilities_bills: 4500,
    finance_banking: 6000,
    other: 0,
  },
  createdAt: now.toISOString(),
  updatedAt: now.toISOString(),
};
