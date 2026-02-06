import { QueryClient } from "@tanstack/react-query";

export const mockCategories = [
  { id: "cat-exp-1", name: "식비", type: "expense" },
  { id: "cat-exp-2", name: "교통", type: "expense" },
  { id: "cat-inc-1", name: "월급", type: "income" },
  { id: "cat-inc-2", name: "부수입", type: "income" },
];

export const mockBudgets = [
  {
    id: "bud-1",
    category_id: "cat-exp-1",
    amount: 500000,
    period: "monthly",
    period_start: "2024-01-01",
    user_id: null,
    categories: { id: "cat-exp-1", name: "식비", type: "expense" },
  },
];

export const storybookQueryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      queryFn: ({ queryKey }) => {
        const key = queryKey[1];
        if (key === "categories") return mockCategories;
        if (key === "budgets") return mockBudgets;
        return [];
      },
    },
  },
});
