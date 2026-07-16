import { Goal } from '@/types';

export const goalsFixture: Goal[] = [
  {
    _id: 'goal_japan_trip',
    userId: 'user_demo_001',
    name: 'Japan Trip 2027',
    targetAmount: 200000,
    savedAmount: 28400,
    targetDate: '2027-09-30T00:00:00.000Z',
    category: 'travel',
    aiPlan: {
      requiredMonthlySavings: 14286,
      projectedCompletionDate: '2027-08-15T00:00:00.000Z',
      recommendations: [
        'Reduce dining out by ₹2,000/month to build a buffer',
        'Trim entertainment spend by ₹1,500/month',
        'Redirect this month’s Swiggy/Zomato savings straight into this goal',
      ],
    },
    status: 'on_track',
    createdAt: '2026-01-10T08:00:00.000Z',
    updatedAt: new Date().toISOString(),
  },
  {
    _id: 'goal_emergency_fund',
    userId: 'user_demo_001',
    name: 'Emergency Fund',
    targetAmount: 150000,
    savedAmount: 96000,
    targetDate: '2026-12-31T00:00:00.000Z',
    category: 'savings',
    aiPlan: {
      requiredMonthlySavings: 10800,
      projectedCompletionDate: '2026-12-05T00:00:00.000Z',
      recommendations: ['You’re ahead of schedule — consider a liquid fund for the surplus.'],
    },
    status: 'ahead',
    createdAt: '2025-12-01T08:00:00.000Z',
    updatedAt: new Date().toISOString(),
  },
  {
    _id: 'goal_new_laptop',
    userId: 'user_demo_001',
    name: 'New MacBook',
    targetAmount: 120000,
    savedAmount: 18000,
    targetDate: '2027-03-01T00:00:00.000Z',
    category: 'shopping',
    aiPlan: {
      requiredMonthlySavings: 12750,
      recommendations: ['Behind pace — increase monthly contribution by ₹2,400 to stay on track.'],
    },
    status: 'behind',
    createdAt: '2026-04-18T08:00:00.000Z',
    updatedAt: new Date().toISOString(),
  },
];
