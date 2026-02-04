import { supabase, getCurrentUserId } from "@/lib/supabase";
import { queryKeys } from "./queryKeys";
import type { StockHolding } from "@/types/domain";
import type { Insertable, Updatable } from "@/types/database";

export async function fetchStockHoldings(): Promise<StockHolding[]> {
  const { data, error } = await supabase.from("stock_holdings").select("*").order("updated_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []) as unknown as StockHolding[];
}

export async function createStockHolding(
  payload: Omit<Insertable<"stock_holdings">, "id" | "updated_at" | "user_id">
): Promise<void> {
  const userId = await getCurrentUserId();
  if (!userId) throw new Error("로그인이 필요합니다.");
  const row: Insertable<"stock_holdings"> = {
    ...payload,
    updated_at: new Date().toISOString(),
    user_id: userId,
  };
  const { error } = await supabase.from("stock_holdings").insert(row as never);
  if (error) throw new Error(error.message);
}

export async function updateStockHolding(id: string, payload: Updatable<"stock_holdings">): Promise<void> {
  const { error } = await supabase
    .from("stock_holdings")
    .update({ ...payload, updated_at: new Date().toISOString() } as never)
    .eq("id", id);
  if (error) throw new Error(error.message);
}

export async function deleteStockHolding(id: string): Promise<void> {
  const { error } = await supabase.from("stock_holdings").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

export { queryKeys as stockQueryKeys };
