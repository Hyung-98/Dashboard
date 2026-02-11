import { supabase, getCurrentUserId } from "@/lib/supabase";
import type { PortfolioTarget } from "@/types/domain";

export async function fetchPortfolioTargets(): Promise<PortfolioTarget[]> {
  const userId = await getCurrentUserId();
  if (!userId) return [];
  const { data, error } = await supabase
    .from("portfolio_targets")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as PortfolioTarget[];
}

export async function upsertPortfolioTargets(
  targets: Array<{ symbol: string; market: "KR" | "US"; target_pct: number }>
): Promise<void> {
  const userId = await getCurrentUserId();
  if (!userId) throw new Error("로그인이 필요합니다.");

  const { error: deleteError } = await supabase
    .from("portfolio_targets")
    .delete()
    .eq("user_id", userId);
  if (deleteError) throw new Error(deleteError.message);

  if (targets.length === 0) return;

  const rows = targets
    .filter((t) => t.target_pct > 0)
    .map((t) => ({
      user_id: userId,
      symbol: t.symbol,
      market: t.market,
      target_pct: t.target_pct,
      updated_at: new Date().toISOString(),
    }));

  if (rows.length === 0) return;

  const { error } = await supabase
    .from("portfolio_targets")
    .insert(rows as never[]);
  if (error) throw new Error(error.message);
}
