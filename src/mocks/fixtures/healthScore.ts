import { HealthScore } from '@/types';
import { dateAt, mulberry32, range } from './generators';

export const currentHealthScoreComponents = {
  budgetAdherence: 178, // /250
  savingsRate: 165, // /250
  debtManagement: 190, // /200
  spendingDiversity: 108, // /150
  goalProgress: 92, // /150
};

export const currentHealthScore =
  currentHealthScoreComponents.budgetAdherence +
  currentHealthScoreComponents.savingsRate +
  currentHealthScoreComponents.debtManagement +
  currentHealthScoreComponents.spendingDiversity +
  currentHealthScoreComponents.goalProgress;

function generateHistory(): HealthScore[] {
  const rng = mulberry32(4471);
  const out: HealthScore[] = [];
  let score = currentHealthScore - 38;

  for (let daysAgo = 29; daysAgo >= 0; daysAgo--) {
    score += range(rng, -6, 8);
    score = Math.max(520, Math.min(currentHealthScore, score));
    const ratio = score / currentHealthScore;
    out.push({
      _id: `hs_${daysAgo}`,
      userId: 'user_demo_001',
      score: Math.round(daysAgo === 0 ? currentHealthScore : score),
      components: {
        budgetAdherence: Math.round(currentHealthScoreComponents.budgetAdherence * ratio),
        savingsRate: Math.round(currentHealthScoreComponents.savingsRate * ratio),
        debtManagement: Math.round(currentHealthScoreComponents.debtManagement * ratio),
        spendingDiversity: Math.round(currentHealthScoreComponents.spendingDiversity * ratio),
        goalProgress: Math.round(currentHealthScoreComponents.goalProgress * ratio),
      },
      date: dateAt(daysAgo, 6, 0),
    });
  }
  return out;
}

export const healthScoreHistory = generateHistory();
