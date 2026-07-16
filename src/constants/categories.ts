import { HelpCircle } from 'lucide-react-native';
import {
  FoodIcon,
  TransportIcon,
  ShoppingIcon,
  EntertainmentIcon,
  HealthIcon,
  BillsIcon,
  BankingIcon,
  WalletIcon,
  TransferIcon,
  type IconComponent,
} from '@/components/ui/icons/ImageIcon';

export interface CategoryDef {
  key: string;
  label: string;
  icon: IconComponent;
  color: string;
  merchants: string[];
}

/** Primary categories & India-specific merchants, spec §7.5. */
export const CATEGORIES: CategoryDef[] = [
  {
    key: 'food_dining',
    label: 'Food & Dining',
    icon: FoodIcon,
    color: '#FF9142',
    merchants: ['Swiggy', 'Zomato', 'BigBasket', 'Blinkit', 'Zepto', 'Dunzo'],
  },
  {
    key: 'transportation',
    label: 'Transportation',
    icon: TransportIcon,
    color: '#4FA6FF',
    merchants: ['Ola', 'Uber', 'Rapido', 'IRCTC', 'IndiGo', 'BPCL'],
  },
  {
    key: 'shopping',
    label: 'Shopping',
    icon: ShoppingIcon,
    color: '#C67CFF',
    merchants: ['Amazon.in', 'Flipkart', 'Myntra', 'Nykaa', 'Ajio', 'Meesho'],
  },
  {
    key: 'entertainment',
    label: 'Entertainment',
    icon: EntertainmentIcon,
    color: '#FF6BB3',
    merchants: ['Netflix', 'Prime Video', 'Hotstar', 'BookMyShow', 'Spotify'],
  },
  {
    key: 'health_wellness',
    label: 'Health & Wellness',
    icon: HealthIcon,
    color: '#FF5C5C',
    merchants: ['MedPlus', 'Apollo Pharmacy', '1mg', 'Practo', 'Cult.fit'],
  },
  {
    key: 'utilities_bills',
    label: 'Utilities & Bills',
    icon: BillsIcon,
    color: '#F2D24B',
    merchants: ['BESCOM', 'Jio', 'Airtel', 'BSNL', 'Indane Gas'],
  },
  {
    key: 'finance_banking',
    label: 'Finance & Banking',
    icon: BankingIcon,
    color: '#22E37A',
    merchants: ['LIC', 'Zerodha', 'Groww', 'SBI Life', 'HDFC Mutual Fund'],
  },
  {
    key: 'income',
    label: 'Income',
    icon: WalletIcon,
    color: '#22E37A',
    merchants: ['Salary', 'Freelance', 'Interest', 'Refund'],
  },
  {
    key: 'transfer',
    label: 'Transfer',
    icon: TransferIcon,
    color: '#9CA3AF',
    merchants: [],
  },
  {
    key: 'other',
    label: 'Other',
    icon: HelpCircle,
    color: '#9CA3AF',
    merchants: [],
  },
];

export const CATEGORY_MAP: Record<string, CategoryDef> = Object.fromEntries(
  CATEGORIES.map((c) => [c.key, c]),
);

export function getCategory(key: string): CategoryDef {
  return CATEGORY_MAP[key] ?? CATEGORY_MAP.other;
}
