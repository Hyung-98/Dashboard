import { supabase, getCurrentUserId } from "@/lib/supabase";
import { queryKeys } from "./queryKeys";
import type { BudgetWithCategory } from "@/types/domain";
import type { Insertable, Updatable } from "@/types/database";

export async function fetchBudgets(): Promise<BudgetWithCategory[]> {
  const { data, error } = await supabase
    .from("budgets")
    .select("*, categories(id, name, type)")
    .order("period_start", { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []) as unknown as BudgetWithCategory[];
}

export async function createBudget(payload: Omit<Insertable<"budgets">, "id" | "user_id">): Promise<void> {
  const userId = await getCurrentUserId();
  if (!userId) throw new Error("로그인이 필요합니다.");
  const row: Insertable<"budgets"> = {
    ...payload,
    user_id: userId,
  };
  const { error } = await supabase.from("budgets").insert(row as never);
  if (error) throw new Error(error.message);
}

export async function updateBudget(id: string, payload: Updatable<"budgets">): Promise<void> {
  const { error } = await supabase
    .from("budgets")
    .update(payload as never)
    .eq("id", id);
  if (error) throw new Error(error.message);
}

export async function deleteBudget(id: string): Promise<void> {
  const { error } = await supabase.from("budgets").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

export { queryKeys as budgetQueryKeys };
