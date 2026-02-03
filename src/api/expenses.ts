import { supabase, getCurrentUserId } from "@/lib/supabase";
import { queryKeys } from "./queryKeys";
import type { ExpenseWithCategory } from "@/types/domain";
import type { ExpenseFilters } from "@/types/filters";
import type { Insertable, Updatable } from "@/types/database";

export async function fetchExpenses(filters: ExpenseFilters): Promise<ExpenseWithCategory[]> {
  let q = supabase.from("expenses").select("*, categories(id, name, type)").order("occurred_at", { ascending: false });

  if (filters.from) {
    q = q.gte("occurred_at", filters.from);
  }
  if (filters.to) {
    q = q.lte("occurred_at", filters.to);
  }
  if (filters.categoryId) {
    q = q.eq("category_id", filters.categoryId);
  }
  if (filters.minAmount != null && !Number.isNaN(filters.minAmount)) {
    q = q.gte("amount", filters.minAmount);
  }
  if (filters.maxAmount != null && !Number.isNaN(filters.maxAmount)) {
    q = q.lte("amount", filters.maxAmount);
  }

  const { data, error } = await q;
  if (error) throw new Error(error.message);

  return (data ?? []) as unknown as ExpenseWithCategory[];
}

export async function createExpense(
  payload: Omit<Insertable<"expenses">, "id" | "created_at" | "user_id">
): Promise<void> {
  const userId = await getCurrentUserId();
  if (!userId) throw new Error("로그인이 필요합니다.");
  const row: Insertable<"expenses"> = {
    ...payload,
    user_id: userId,
  };
  const { error } = await supabase.from("expenses").insert(row as never);
  if (error) throw new Error(error.message);
}

export async function updateExpense(id: string, payload: Updatable<"expenses">): Promise<void> {
  const { error } = await supabase
    .from("expenses")
    .update(payload as never)
    .eq("id", id);
  if (error) throw new Error(error.message);
}

export async function deleteExpense(id: string): Promise<void> {
  const { error } = await supabase.from("expenses").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

export { queryKeys as expenseQueryKeys };
