import { AiInsight } from '@/types';
import { dateAt } from './generators';

export const insightsFixture: AiInsight[] = [
  {
    _id: 'insight_predictive_1',
    userId: 'user_demo_001',
    type: 'predictive_warning',
    title: 'You’re on track to breach your budget in 4 days',
    body:
      'At your current pace, you’ll hit ₹45,000 by the 3rd of next month — 4 days before period end. Cut daily spend to ₹950 to land right at budget.',
    confidence: 0.88,
    metadata: { projectedBreachInDays: 4, suggestedDailyTarget: 950 },
    isRead: false,
    expiresAt: dateAt(-6, 0, 0),
    createdAt: dateAt(0, 8, 0),
  },
  {
    _id: 'insight_anomaly_1',
    userId: 'user_demo_001',
    type: 'anomaly_explanation',
    title: 'Unusual transaction: ₹4,899 on IndiGo',
    body:
      'This is 3.4x your typical transportation spend. It looks like a flight booking rather than everyday travel — if that’s right, no action needed.',
    confidence: 0.81,
    metadata: { transactionId: 'txn_0018', category: 'transportation' },
    isRead: false,
    createdAt: dateAt(9, 7, 10),
  },
  {
    _id: 'insight_savings_1',
    userId: 'user_demo_001',
    type: 'savings_opportunity',
    title: 'Cut Swiggy/Zomato to twice a week and save ₹1,840/month',
    body:
      'You’ve ordered food delivery 11 times this month for ₹4,610. Trimming to twice a week would free up ₹1,840/month toward your Japan trip.',
    confidence: 0.79,
    metadata: { projectedMonthlySavings: 1840, category: 'food_dining' },
    isRead: false,
    createdAt: dateAt(1, 9, 0),
  },
  {
    _id: 'insight_goal_1',
    userId: 'user_demo_001',
    type: 'goal_coaching',
    title: 'Japan Trip 2027 is on track',
    body:
      'You need ₹14,286/month to hit ₹2,00,000 by September 2027. At your current pace you’ll actually finish a month early — nice work.',
    confidence: 0.9,
    metadata: { goalId: 'goal_japan_trip' },
    isRead: true,
    createdAt: dateAt(3, 9, 0),
  },
  {
    _id: 'insight_subscription_1',
    userId: 'user_demo_001',
    type: 'subscription_audit',
    title: '6 subscriptions cost you ₹5,164/month',
    body:
      'That’s ₹61,968/year — 11% of your annual income goes to subscriptions. Cult.fit’s usage looks low this month; consider pausing it.',
    confidence: 0.84,
    metadata: { monthlyTotal: 5164, annualTotal: 61968 },
    isRead: false,
    createdAt: dateAt(2, 9, 0),
  },
  {
    _id: 'insight_digest_1',
    userId: 'user_demo_001',
    type: 'weekly_digest',
    title: 'Your week in review',
    body:
      'You spent ₹8,240 this week, 12% below last week. Food & Dining remains your top category. One anomaly flagged (IndiGo, ₹4,899). Two bills due in the next 3 days.',
    confidence: 0.95,
    metadata: { weekOverWeekDelta: -12 },
    isRead: true,
    createdAt: dateAt(0, 9, 0),
  },
  {
    _id: 'insight_tax_1',
    userId: 'user_demo_001',
    type: 'tax_optimisation',
    title: '₹18,400 in deductible health & wellness spend so far',
    body: 'Apollo Pharmacy, 1mg and Practo charges this year may be eligible under Section 80D — keep the receipts handy for ITR filing.',
    confidence: 0.72,
    metadata: { deductibleTotal: 18400, section: '80D' },
    isRead: false,
    createdAt: dateAt(11, 9, 0),
  },
];
