import { useSearchParams } from "react-router-dom";
import {
  parseExpenseFiltersFromSearchParams,
  expenseFiltersToSearchParams,
  type ExpenseFilters,
} from "@/types/filters";

export function useExpenseFilters(): [ExpenseFilters, (updates: Partial<ExpenseFilters>) => void] {
  const [searchParams, setSearchParams] = useSearchParams();
  const filters = parseExpenseFiltersFromSearchParams(searchParams);

  const setFilters = (updates: Partial<ExpenseFilters>) => {
    const next = { ...filters, ...updates };
    const params = expenseFiltersToSearchParams(next);
    setSearchParams(params, { replace: true });
  };

  return [filters, setFilters];
}
