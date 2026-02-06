import { supabase, getCurrentUserId } from "@/lib/supabase";
import { queryKeys } from "./queryKeys";
import type { Tables } from "@/types/database";
import type { Insertable, Updatable } from "@/types/database";

export type SavingsGoal = Tables<"savings_goals">;

export async function fetchSavingsGoals(): Promise<SavingsGoal[]> {
  const userId = await getCurrentUserId();
  if (!userId) return [];
  const { data, error } = await supabase
    .from("savings_goals")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as SavingsGoal[];
}

export async function createSavingsGoal(
  payload: Omit<Insertable<"savings_goals">, "id" | "created_at" | "updated_at" | "user_id">
): Promise<void> {
  const userId = await getCurrentUserId();
  if (!userId) throw new Error("로그인이 필요합니다.");
  const row: Insertable<"savings_goals"> = {
    ...payload,
    user_id: userId,
  };
  const { error } = await supabase.from("savings_goals").insert(row as never);
  if (error) throw new Error(error.message);
}

export async function updateSavingsGoal(
  id: string,
  payload: Updatable<"savings_goals">
): Promise<void> {
  const { error } = await supabase
    .from("savings_goals")
    .update({ ...payload, updated_at: new Date().toISOString() } as never)
    .eq("id", id);
  if (error) throw new Error(error.message);
}

export async function deleteSavingsGoal(id: string): Promise<void> {
  const { error } = await supabase.from("savings_goals").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

export { queryKeys as savingsGoalQueryKeys };
