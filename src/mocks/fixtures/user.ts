import { User } from '@/types';

export const demoUser: User = {
  _id: 'user_demo_001',
  name: 'Raj Saha',
  email: 'raj.saha@gmail.com.com',
  phone: '+919820012345',
  currency: 'INR',
  monthlyBudget: 45000,
  stopLossAmount: 50000,
  stopLossAlertPct: 80,
  aiProfile: {
    riskTolerance: 'medium',
    spendingPersona: 'Balanced Planner',
    financialGoals: ['Japan Trip 2027', 'Emergency Fund', 'Reduce dining out spend'],
  },
  isPremium: true,
  quietHours: { start: '22:00', end: '08:00' },
  createdAt: '2025-11-02T09:12:00.000Z',
  updatedAt: new Date().toISOString(),
};
