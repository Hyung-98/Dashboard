import { describe, it, expect } from "vitest";
import {
  parseExpenseFiltersFromSearchParams,
  expenseFiltersToSearchParams,
  DEFAULT_EXPENSE_FILTERS,
  parseIncomeFiltersFromSearchParams,
  incomeFiltersToSearchParams,
  DEFAULT_INCOME_FILTERS,
  type ExpenseFilters,
  type IncomeFilters,
} from "./filters";

describe("parseExpenseFiltersFromSearchParams", () => {
  it("returns default filters for empty search params", () => {
    const params = new URLSearchParams();
    expect(parseExpenseFiltersFromSearchParams(params)).toEqual(DEFAULT_EXPENSE_FILTERS);
  });

  it("parses from, to, categoryId as strings", () => {
    const params = new URLSearchParams({
      from: "2024-01-01",
      to: "2024-12-31",
      categoryId: "cat-1",
    });
    expect(parseExpenseFiltersFromSearchParams(params)).toEqual({
      from: "2024-01-01",
      to: "2024-12-31",
      categoryId: "cat-1",
      minAmount: null,
      maxAmount: null,
      query: null,
    });
  });

  it("parses minAmount and maxAmount as numbers", () => {
    const params = new URLSearchParams({ minAmount: "1000", maxAmount: "50000" });
    expect(parseExpenseFiltersFromSearchParams(params)).toMatchObject({
      minAmount: 1000,
      maxAmount: 50000,
    });
  });

  it("treats empty string minAmount/maxAmount as null", () => {
    const params = new URLSearchParams({ minAmount: "", maxAmount: "" });
    expect(parseExpenseFiltersFromSearchParams(params)).toMatchObject({
      minAmount: null,
      maxAmount: null,
    });
  });

  it("treats missing minAmount/maxAmount as null", () => {
    const params = new URLSearchParams();
    const result = parseExpenseFiltersFromSearchParams(params);
    expect(result.minAmount).toBeNull();
    expect(result.maxAmount).toBeNull();
  });

  it("parses zero as 0 (valid number)", () => {
    const params = new URLSearchParams({ minAmount: "0", maxAmount: "0" });
    expect(parseExpenseFiltersFromSearchParams(params)).toMatchObject({
      minAmount: 0,
      maxAmount: 0,
    });
  });

  it("parses invalid number string as NaN (Number() behavior)", () => {
    const params = new URLSearchParams({ minAmount: "abc", maxAmount: "1e2" });
    const result = parseExpenseFiltersFromSearchParams(params);
    expect(Number.isNaN(result.minAmount)).toBe(true);
    expect(result.maxAmount).toBe(100);
  });

  it("uses null for categoryId when not present", () => {
    const params = new URLSearchParams();
    expect(parseExpenseFiltersFromSearchParams(params).categoryId).toBeNull();
  });

  it("uses null for categoryId when empty string", () => {
    const params = new URLSearchParams({ categoryId: "" });
    expect(parseExpenseFiltersFromSearchParams(params).categoryId).toBeNull();
  });
});

describe("expenseFiltersToSearchParams", () => {
  it("returns empty params for default filters", () => {
    const params = expenseFiltersToSearchParams(DEFAULT_EXPENSE_FILTERS);
    expect(params.toString()).toBe("");
  });

  it("serializes all set fields", () => {
    const filters: ExpenseFilters = {
      from: "2024-01-01",
      to: "2024-12-31",
      categoryId: "cat-1",
      minAmount: 1000,
      maxAmount: 50000,
      query: "검색",
    };
    const params = expenseFiltersToSearchParams(filters);
    expect(params.get("from")).toBe("2024-01-01");
    expect(params.get("to")).toBe("2024-12-31");
    expect(params.get("categoryId")).toBe("cat-1");
    expect(params.get("minAmount")).toBe("1000");
    expect(params.get("maxAmount")).toBe("50000");
    expect(params.get("query")).toBe("검색");
  });

  it("omits null and empty values", () => {
    const filters: ExpenseFilters = {
      from: "",
      to: "",
      categoryId: null,
      minAmount: null,
      maxAmount: null,
      query: null,
    };
    const params = expenseFiltersToSearchParams(filters);
    expect(params.has("from")).toBe(false);
    expect(params.has("to")).toBe(false);
    expect(params.has("categoryId")).toBe(false);
    expect(params.has("minAmount")).toBe(false);
    expect(params.has("maxAmount")).toBe(false);
    expect(params.has("query")).toBe(false);
  });

  it("omits NaN minAmount/maxAmount", () => {
    const filters: ExpenseFilters = {
      ...DEFAULT_EXPENSE_FILTERS,
      minAmount: Number.NaN,
      maxAmount: Number.NaN,
    };
    const params = expenseFiltersToSearchParams(filters);
    expect(params.has("minAmount")).toBe(false);
    expect(params.has("maxAmount")).toBe(false);
  });

  it("round-trips with parseExpenseFiltersFromSearchParams", () => {
    const filters: ExpenseFilters = {
      from: "2024-06-01",
      to: "2024-06-30",
      categoryId: "cat-2",
      minAmount: 500,
      maxAmount: 10000,
      query: null,
    };
    const params = expenseFiltersToSearchParams(filters);
    expect(parseExpenseFiltersFromSearchParams(params)).toEqual(filters);
  });
});

describe("parseIncomeFiltersFromSearchParams", () => {
  it("returns default filters for empty search params", () => {
    const params = new URLSearchParams();
    expect(parseIncomeFiltersFromSearchParams(params)).toEqual(DEFAULT_INCOME_FILTERS);
  });

  it("parses from, to, categoryId, numeric amounts and query", () => {
    const params = new URLSearchParams({
      from: "2024-01-01",
      to: "2024-12-31",
      categoryId: "inc-cat",
      minAmount: "2000",
      maxAmount: "100000",
      query: "급여",
    });
    expect(parseIncomeFiltersFromSearchParams(params)).toEqual({
      from: "2024-01-01",
      to: "2024-12-31",
      categoryId: "inc-cat",
      minAmount: 2000,
      maxAmount: 100000,
      query: "급여",
    });
  });

  it("treats empty minAmount/maxAmount as null", () => {
    const params = new URLSearchParams({ minAmount: "", maxAmount: "" });
    expect(parseIncomeFiltersFromSearchParams(params)).toMatchObject({
      minAmount: null,
      maxAmount: null,
    });
  });
});

describe("incomeFiltersToSearchParams", () => {
  it("returns empty params for default filters", () => {
    const params = incomeFiltersToSearchParams(DEFAULT_INCOME_FILTERS);
    expect(params.toString()).toBe("");
  });

  it("serializes all set fields and round-trips", () => {
    const filters: IncomeFilters = {
      from: "2024-03-01",
      to: "2024-03-31",
      categoryId: "inc-1",
      minAmount: 3000,
      maxAmount: 200000,
      query: null,
    };
    const params = incomeFiltersToSearchParams(filters);
    expect(parseIncomeFiltersFromSearchParams(params)).toEqual(filters);
  });

  it("omits NaN amounts", () => {
    const filters: IncomeFilters = {
      ...DEFAULT_INCOME_FILTERS,
      minAmount: Number.NaN,
      maxAmount: Number.NaN,
    };
    const params = incomeFiltersToSearchParams(filters);
    expect(params.has("minAmount")).toBe(false);
    expect(params.has("maxAmount")).toBe(false);
  });
});
