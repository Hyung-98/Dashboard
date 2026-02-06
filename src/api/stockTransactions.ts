import { supabase, getCurrentUserId } from "@/lib/supabase";
import { queryKeys } from "./queryKeys";
import type { Tables } from "@/types/database";
import type { Insertable } from "@/types/database";

export type StockTransaction = Tables<"stock_transactions">;

export async function fetchStockTransactions(): Promise<StockTransaction[]> {
  const userId = await getCurrentUserId();
  if (!userId) return [];
  const { data, error } = await supabase
    .from("stock_transactions")
    .select("*")
    .eq("user_id", userId)
    .order("occurred_at", { ascending: false })
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as StockTransaction[];
}

export async function createStockTransaction(
  payload: Omit<Insertable<"stock_transactions">, "id" | "created_at" | "user_id">
): Promise<void> {
  const userId = await getCurrentUserId();
  if (!userId) throw new Error("로그인이 필요합니다.");
  const row: Insertable<"stock_transactions"> = {
    ...payload,
    user_id: userId,
  };
  const { error } = await supabase.from("stock_transactions").insert(row as never);
  if (error) throw new Error(error.message);
}

export async function deleteStockTransaction(id: string): Promise<void> {
  const { error } = await supabase.from("stock_transactions").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

export { queryKeys as stockTransactionQueryKeys };
