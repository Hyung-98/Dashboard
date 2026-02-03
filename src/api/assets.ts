import { supabase, getCurrentUserId } from "@/lib/supabase";
import { queryKeys } from "./queryKeys";
import type { AssetWithCategory } from "@/types/domain";
import type { Insertable, Updatable } from "@/types/database";

export async function fetchAssets(): Promise<AssetWithCategory[]> {
  const { data, error } = await supabase
    .from("assets")
    .select("*, categories(id, name, type)")
    .order("updated_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []) as unknown as AssetWithCategory[];
}

export async function createAsset(payload: Omit<Insertable<"assets">, "id" | "updated_at" | "user_id">): Promise<void> {
  const userId = await getCurrentUserId();
  if (!userId) throw new Error("로그인이 필요합니다.");
  const row: Insertable<"assets"> = {
    ...payload,
    updated_at: new Date().toISOString().slice(0, 10),
    user_id: userId,
  };
  const { error } = await supabase.from("assets").insert(row as never);
  if (error) throw new Error(error.message);
}

export async function updateAsset(id: string, payload: Updatable<"assets">): Promise<void> {
  const { error } = await supabase
    .from("assets")
    .update(payload as never)
    .eq("id", id);
  if (error) throw new Error(error.message);
}

export async function deleteAsset(id: string): Promise<void> {
  const { error } = await supabase.from("assets").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

export { queryKeys as assetQueryKeys };
