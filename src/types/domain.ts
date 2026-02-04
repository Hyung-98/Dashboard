import type { Tables } from "./database";

export type Category = Tables<"categories">;
export type Expense = Tables<"expenses">;
export type Budget = Tables<"budgets">;
export type Asset = Tables<"assets">;
export type Income = Tables<"incomes">;
export type StockHolding = Tables<"stock_holdings">;

export interface CategoryRow {
  id: string;
  name: string;
  type: string;
}

export interface ExpenseWithCategory extends Expense {
  categories: CategoryRow | null;
}

export interface BudgetWithCategory extends Tables<"budgets"> {
  categories: CategoryRow | null;
}

export interface AssetWithCategory extends Tables<"assets"> {
  categories: CategoryRow | null;
}

export interface IncomeWithCategory extends Tables<"incomes"> {
  categories: CategoryRow | null;
}
