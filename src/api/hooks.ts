import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchCategories, seedDefaultCategories, createCategory, updateCategory, deleteCategory } from "./categories";
import { fetchExpenses, createExpense, updateExpense, deleteExpense } from "./expenses";
import { fetchBudgets, createBudget, updateBudget, deleteBudget } from "./budgets";
import { fetchAssets, createAsset, updateAsset, deleteAsset } from "./assets";
import { fetchIncomes, createIncome, updateIncome, deleteIncome } from "./incomes";
import { queryKeys } from "./queryKeys";
import type { ExpenseFilters } from "@/types/filters";
import type { IncomeFilters } from "@/types/filters";
import type { Insertable, Updatable } from "@/types/database";

export function useCategories() {
  return useQuery({
    queryKey: queryKeys.categories(),
    queryFn: fetchCategories,
  });
}

export function useSeedDefaultCategories() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: seedDefaultCategories,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.categories() });
    },
  });
}

export function useCreateCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: Omit<Insertable<"categories">, "id" | "user_id">) => createCategory(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.categories() });
    },
  });
}

export function useUpdateCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Updatable<"categories"> }) => updateCategory(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.categories() });
    },
  });
}

export function useDeleteCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.categories() });
    },
  });
}

export function useExpenses(filters: ExpenseFilters) {
  return useQuery({
    queryKey: queryKeys.expenses(filters),
    queryFn: () => fetchExpenses(filters),
  });
}

export function useBudgets() {
  return useQuery({
    queryKey: queryKeys.budgets(),
    queryFn: fetchBudgets,
  });
}

export function useAssets() {
  return useQuery({
    queryKey: queryKeys.assets(),
    queryFn: fetchAssets,
  });
}

export function useCreateExpense() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: Omit<Insertable<"expenses">, "id" | "created_at" | "user_id">) => createExpense(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...queryKeys.all, "expenses"] });
    },
  });
}

export function useUpdateExpense() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Updatable<"expenses"> }) => updateExpense(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...queryKeys.all, "expenses"] });
    },
  });
}

export function useDeleteExpense() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteExpense,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...queryKeys.all, "expenses"] });
    },
  });
}

export function useCreateBudget() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: Omit<Insertable<"budgets">, "id" | "user_id">) => createBudget(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.budgets() });
    },
  });
}

export function useUpdateBudget() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Updatable<"budgets"> }) => updateBudget(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.budgets() });
    },
  });
}

export function useDeleteBudget() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteBudget,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.budgets() });
    },
  });
}

export function useCreateAsset() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: Omit<Insertable<"assets">, "id" | "updated_at" | "user_id">) => createAsset(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.assets() });
    },
  });
}

export function useUpdateAsset() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Updatable<"assets"> }) => updateAsset(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.assets() });
    },
  });
}

export function useDeleteAsset() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteAsset,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.assets() });
    },
  });
}

export function useIncomes(filters: IncomeFilters) {
  return useQuery({
    queryKey: queryKeys.incomes(filters),
    queryFn: () => fetchIncomes(filters),
  });
}

export function useCreateIncome() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: Omit<Insertable<"incomes">, "id" | "created_at" | "user_id">) => createIncome(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...queryKeys.all, "incomes"] });
    },
  });
}

export function useUpdateIncome() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Updatable<"incomes"> }) => updateIncome(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...queryKeys.all, "incomes"] });
    },
  });
}

export function useDeleteIncome() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteIncome,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...queryKeys.all, "incomes"] });
    },
  });
}
