import { Transaction } from '@/types';
import { dateAt, mulberry32, pick, range } from './generators';

let seq = 1;
function nextId() {
  return `txn_${String(seq++).padStart(4, '0')}`;
}

function base(
  daysAgo: number,
  hour: number,
  minute: number,
  type: Transaction['type'],
  category: string,
  merchant: string,
  amount: number,
  paymentMethod: Transaction['paymentMethod'],
  extra: Partial<Transaction> = {},
): Transaction {
  const at = dateAt(daysAgo, hour, minute);
  return {
    _id: nextId(),
    userId: 'user_demo_001',
    type,
    amount,
    currency: 'INR',
    category,
    merchant,
    paymentMethod,
    upiRefId: paymentMethod === 'UPI' ? `UPI${Math.floor(range(mulberry32(daysAgo * 97 + minute), 1e11, 9e11))}` : undefined,
    aiCategorized: true,
    isAnomalous: false,
    status: 'confirmed',
    tags: [],
    transactionAt: at,
    createdAt: at,
    updatedAt: at,
    ...extra,
  };
}

/** Hand-authored trailing-30-day window — deliberately sums to ~84% of the ₹45,000 budget (Orange tier). */
export const currentWindowTransactions: Transaction[] = [
  base(0, 13, 20, 'expense', 'food_dining', 'Swiggy', 320, 'UPI'),
  base(0, 19, 5, 'expense', 'transportation', 'Ola', 180, 'UPI'),
  base(1, 20, 40, 'expense', 'food_dining', 'Zomato', 540, 'UPI'),
  base(1, 9, 0, 'expense', 'entertainment', 'Netflix', 649, 'UPI', { tags: ['subscription'] }),
  base(2, 18, 15, 'expense', 'food_dining', 'BigBasket', 1450, 'UPI'),
  base(2, 8, 45, 'expense', 'transportation', 'Uber', 220, 'card'),
  base(3, 16, 30, 'expense', 'shopping', 'Amazon.in', 2399, 'card'),
  base(4, 11, 10, 'expense', 'health_wellness', 'Apollo Pharmacy', 380, 'UPI'),
  base(4, 17, 50, 'expense', 'food_dining', 'Third Wave Coffee', 260, 'UPI'),
  base(5, 10, 0, 'expense', 'utilities_bills', 'Jio', 599, 'UPI', { tags: ['subscription'] }),
  base(5, 21, 5, 'expense', 'food_dining', 'Swiggy', 410, 'UPI'),
  base(6, 12, 0, 'expense', 'utilities_bills', 'BESCOM', 1240, 'netbanking'),
  base(6, 19, 40, 'expense', 'shopping', 'Myntra', 1899, 'card'),
  base(7, 9, 30, 'expense', 'entertainment', 'Spotify', 119, 'UPI', { tags: ['subscription'] }),
  base(7, 8, 10, 'expense', 'transportation', 'Rapido', 90, 'UPI'),
  base(8, 20, 0, 'expense', 'food_dining', 'Zepto', 680, 'UPI'),
  base(8, 7, 0, 'expense', 'health_wellness', 'Cult.fit', 999, 'UPI', { tags: ['subscription'] }),
  base(9, 6, 30, 'expense', 'transportation', 'IndiGo', 4899, 'card', {
    isAnomalous: true,
    anomalyScore: -0.62,
    notes: 'Flight booking — 3.4x higher than usual transport spend',
  }),
  base(10, 13, 45, 'expense', 'food_dining', 'Swiggy', 295, 'UPI'),
  base(11, 17, 20, 'expense', 'shopping', 'Flipkart', 3299, 'card'),
  base(12, 9, 15, 'expense', 'transportation', 'BPCL', 1500, 'UPI'),
  base(13, 20, 30, 'expense', 'food_dining', 'Zomato', 610, 'UPI'),
  base(14, 11, 0, 'expense', 'health_wellness', '1mg', 450, 'UPI'),
  base(15, 10, 30, 'expense', 'utilities_bills', 'Airtel', 799, 'UPI', { tags: ['subscription'] }),
  base(16, 12, 40, 'expense', 'food_dining', 'Swiggy', 350, 'UPI'),
  base(16, 18, 10, 'expense', 'transportation', 'Ola', 210, 'UPI'),
  base(17, 21, 0, 'expense', 'entertainment', 'BookMyShow', 700, 'UPI'),
  base(18, 19, 0, 'expense', 'food_dining', 'BigBasket', 1680, 'UPI'),
  base(19, 15, 30, 'expense', 'health_wellness', 'Practo', 500, 'UPI'),
  base(20, 14, 0, 'expense', 'shopping', 'Amazon.in', 899, 'card'),
  base(21, 20, 45, 'expense', 'food_dining', 'Zomato', 480, 'UPI'),
  base(22, 9, 20, 'expense', 'transportation', 'Uber', 340, 'card'),
  base(23, 16, 0, 'expense', 'shopping', 'Ajio', 1499, 'card'),
  base(24, 13, 10, 'expense', 'food_dining', 'Swiggy', 520, 'UPI'),
  base(25, 10, 0, 'expense', 'finance_banking', 'HDFC Mutual Fund', 5000, 'netbanking', { tags: ['sip'] }),
  base(26, 19, 30, 'expense', 'food_dining', 'Zomato', 390, 'UPI'),
  base(27, 9, 0, 'income', 'income', 'Salary', 85000, 'netbanking', { description: 'Monthly salary — Times Group' }),
  base(28, 11, 0, 'income', 'income', 'Freelance', 12000, 'UPI', { description: 'Freelance design project' }),
  base(28, 17, 30, 'expense', 'shopping', 'Nykaa', 799, 'card'),
  base(29, 13, 0, 'expense', 'food_dining', 'Swiggy', 275, 'UPI'),
  // Pending — awaiting user confirmation (fresh OCR scan / UPI import demo)
  base(0, 21, 40, 'expense', 'food_dining', "Domino's Pizza", 899, 'UPI', {
    status: 'pending',
    receiptUrl: 'https://images.nuvo.app/mock/receipts/dominos.jpg',
    ocrData: {
      confidence: 0.93,
      items: [
        { name: 'Farmhouse Pizza (Medium)', qty: 1, unitPrice: 549, totalPrice: 549 },
        { name: 'Choco Lava Cake', qty: 2, unitPrice: 95, totalPrice: 190 },
        { name: 'Coke 750ml', qty: 1, unitPrice: 60, totalPrice: 60 },
      ],
      taxAmount: 100,
      rawText: "DOMINO'S PIZZA\nFarmhouse Pizza (M) 549\nChoco Lava x2 190\nCoke 750ml 60\nGST 100\nTOTAL 899",
    },
  }),
  // Pending — possible duplicate flagged for review (spec §7.6 Duplicate Detection demo)
  base(6, 12, 4, 'expense', 'utilities_bills', 'BESCOM', 1240, 'netbanking', {
    status: 'pending',
    isAnomalous: true,
    anomalyScore: -0.81,
    notes: 'Possible duplicate — same amount & merchant within 4 minutes of a confirmed transaction',
  }),
];

/** Prior ~45 days — looser, generated history for trend charts, year-in-review and health-score deltas. */
function generateOlderTransactions(): Transaction[] {
  const rng = mulberry32(20260715);
  const pool: { category: string; merchants: string[]; min: number; max: number }[] = [
    { category: 'food_dining', merchants: ['Swiggy', 'Zomato', 'BigBasket', 'Blinkit', 'Zepto'], min: 200, max: 1600 },
    { category: 'transportation', merchants: ['Ola', 'Uber', 'Rapido', 'BPCL'], min: 90, max: 1800 },
    { category: 'shopping', merchants: ['Amazon.in', 'Flipkart', 'Myntra', 'Ajio', 'Meesho'], min: 400, max: 3600 },
    { category: 'entertainment', merchants: ['Netflix', 'Prime Video', 'Hotstar', 'BookMyShow', 'Spotify'], min: 119, max: 900 },
    { category: 'health_wellness', merchants: ['MedPlus', 'Apollo Pharmacy', '1mg', 'Cult.fit'], min: 200, max: 1400 },
    { category: 'utilities_bills', merchants: ['BESCOM', 'Jio', 'Airtel', 'Indane Gas'], min: 300, max: 2400 },
  ];
  const methods: Transaction['paymentMethod'][] = ['UPI', 'card', 'cash', 'netbanking'];
  const out: Transaction[] = [];

  for (let daysAgo = 30; daysAgo <= 75; daysAgo++) {
    const entries = rng() > 0.4 ? 1 : rng() > 0.7 ? 2 : 0;
    for (let i = 0; i < entries; i++) {
      const group = pick(rng, pool);
      const merchant = pick(rng, group.merchants);
      const amount = Math.round(range(rng, group.min, group.max));
      const hour = Math.floor(range(rng, 8, 22));
      const minute = Math.floor(range(rng, 0, 59));
      out.push(base(daysAgo, hour, minute, 'expense', group.category, merchant, amount, pick(rng, methods)));
    }
    // Monthly salary echo around the 27th day of each prior month window
    if (daysAgo === 57 || daysAgo === 27 + 30) {
      out.push(base(daysAgo, 9, 0, 'income', 'income', 'Salary', 83500, 'netbanking'));
    }
  }
  return out;
}

export const olderTransactions = generateOlderTransactions();

export const allTransactions: Transaction[] = [...currentWindowTransactions, ...olderTransactions].sort(
  (a, b) => new Date(b.transactionAt).getTime() - new Date(a.transactionAt).getTime(),
);
