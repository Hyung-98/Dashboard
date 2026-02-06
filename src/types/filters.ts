/**
 * URL query string과 1:1 매핑되는 필터 타입.
 */
export interface ExpenseFilters {
  from: string; // YYYY-MM-DD
  to: string;
  categoryId: string | null;
  minAmount: number | null;
  maxAmount: number | null;
  query: string | null; // memo search
}

export const DEFAULT_EXPENSE_FILTERS: ExpenseFilters = {
  from: "",
  to: "",
  categoryId: null,
  minAmount: null,
  maxAmount: null,
  query: null,
};

export function parseExpenseFiltersFromSearchParams(searchParams: URLSearchParams): ExpenseFilters {
  const from = searchParams.get("from") ?? "";
  const to = searchParams.get("to") ?? "";
  const categoryId = searchParams.get("categoryId");
  const minAmountRaw = searchParams.get("minAmount");
  const maxAmountRaw = searchParams.get("maxAmount");
  const query = searchParams.get("query");
  return {
    from,
    to,
    categoryId: categoryId || null,
    minAmount: minAmountRaw != null && minAmountRaw !== "" ? Number(minAmountRaw) : null,
    maxAmount: maxAmountRaw != null && maxAmountRaw !== "" ? Number(maxAmountRaw) : null,
    query: query || null,
  };
}

export function expenseFiltersToSearchParams(filters: ExpenseFilters): URLSearchParams {
  const params = new URLSearchParams();
  if (filters.from) params.set("from", filters.from);
  if (filters.to) params.set("to", filters.to);
  if (filters.categoryId) params.set("categoryId", filters.categoryId);
  if (filters.minAmount != null && !Number.isNaN(filters.minAmount)) {
    params.set("minAmount", String(filters.minAmount));
  }
  if (filters.maxAmount != null && !Number.isNaN(filters.maxAmount)) {
    params.set("maxAmount", String(filters.maxAmount));
  }
  if (filters.query) params.set("query", filters.query);
  return params;
}

export interface IncomeFilters {
  from: string;
  to: string;
  categoryId: string | null;
  minAmount: number | null;
  maxAmount: number | null;
  query: string | null; // memo search
}

export const DEFAULT_INCOME_FILTERS: IncomeFilters = {
  from: "",
  to: "",
  categoryId: null,
  minAmount: null,
  maxAmount: null,
  query: null,
};

export function parseIncomeFiltersFromSearchParams(searchParams: URLSearchParams): IncomeFilters {
  const from = searchParams.get("from") ?? "";
  const to = searchParams.get("to") ?? "";
  const categoryId = searchParams.get("categoryId");
  const minAmountRaw = searchParams.get("minAmount");
  const maxAmountRaw = searchParams.get("maxAmount");
  const query = searchParams.get("query");
  return {
    from,
    to,
    categoryId: categoryId || null,
    minAmount: minAmountRaw != null && minAmountRaw !== "" ? Number(minAmountRaw) : null,
    maxAmount: maxAmountRaw != null && maxAmountRaw !== "" ? Number(maxAmountRaw) : null,
    query: query || null,
  };
}

export function incomeFiltersToSearchParams(filters: IncomeFilters): URLSearchParams {
  const params = new URLSearchParams();
  if (filters.from) params.set("from", filters.from);
  if (filters.to) params.set("to", filters.to);
  if (filters.categoryId) params.set("categoryId", filters.categoryId);
  if (filters.minAmount != null && !Number.isNaN(filters.minAmount)) {
    params.set("minAmount", String(filters.minAmount));
  }
  if (filters.maxAmount != null && !Number.isNaN(filters.maxAmount)) {
    params.set("maxAmount", String(filters.maxAmount));
  }
  if (filters.query) params.set("query", filters.query);
  return params;
}
