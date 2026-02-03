import { useSearchParams } from "react-router-dom";
import { parseIncomeFiltersFromSearchParams, incomeFiltersToSearchParams, type IncomeFilters } from "@/types/filters";

export function useIncomeFilters(): [IncomeFilters, (updates: Partial<IncomeFilters>) => void] {
  const [searchParams, setSearchParams] = useSearchParams();
  const filters = parseIncomeFiltersFromSearchParams(searchParams);

  const setFilters = (updates: Partial<IncomeFilters>) => {
    const next = { ...filters, ...updates };
    const params = incomeFiltersToSearchParams(next);
    setSearchParams(params, { replace: true });
  };

  return [filters, setFilters];
}
