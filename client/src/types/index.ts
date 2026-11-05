export interface User {
  id: string;
  email: string;
  name?: string;
}

export interface Category {
  id: string;
  name: string;
  emoji: string;
}

export interface Transaction {
  id: string;
  type: 'INCOME' | 'EXPENSE';
  date: string;
  concept: string;
  amount: number;
  category: Category | null;
  description: string | null;
}

export interface CategorySummary {
  categoryId: string;
  categoryName: string;
  emoji: string;
  allocatedAmount: number;
  spentAmount: number;
  remainingAmount: number;
  executionPercentage: number | null;
  hasBudget: boolean;
  isExceeded: boolean;
}

export interface ShoppingSummary {
  active_lists: number;
  total_items: number;
  purchased_items: number;
  pending_items: number;
  completion_percentage: number;
}

export interface DashboardData {
  selected_period: string;
  period_status: 'OPEN' | 'CLOSED';
  monthly_income: number;
  monthly_expenses: number;
  monthly_net_balance: number;
  opening_balance: number;
  available_balance: number;
  total_budget: number;
  unallocated_budget: number;
  budget_execution_percentage: number | null;
  recent_transactions: Transaction[];
  category_summary: CategorySummary[];
  shopping_summary: ShoppingSummary;
  alerts: string[];
}

export interface ShoppingItem {
  id: string;
  name: string;
  quantity: number;
  estimatedPrice: number | null;
  notes: string | null;
  isPurchased: boolean;
  purchasedAt: string | null;
}

export interface ShoppingList {
  id: string;
  name: string;
  referencePeriod: string | null;
  status: string;
  createdAt: string;
  totalItems: number;
  purchasedItems: number;
  pendingItems: number;
  completionPercentage: number;
  items: ShoppingItem[];
}
