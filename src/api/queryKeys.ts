import type { ExpenseFilters } from "@/types/filters";
import type { IncomeFilters } from "@/types/filters";

export const queryKeys = {
  all: ["dashboard"] as const,
  categories: () => [...queryKeys.all, "categories"] as const,
  expenses: (filters: ExpenseFilters) => [...queryKeys.all, "expenses", filters] as const,
  budgets: () => [...queryKeys.all, "budgets"] as const,
  assets: () => [...queryKeys.all, "assets"] as const,
  incomes: (filters: IncomeFilters) => [...queryKeys.all, "incomes", filters] as const,
};
