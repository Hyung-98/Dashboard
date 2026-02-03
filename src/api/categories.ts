import { supabase, getCurrentUserId } from "@/lib/supabase";
import { queryKeys } from "./queryKeys";
import type { Category } from "@/types/domain";
import type { CategoryType } from "@/types/database";
import type { Insertable, Updatable } from "@/types/database";

const DEFAULT_CATEGORIES: { name: string; type: CategoryType }[] = [
  { name: "식비", type: "expense" },
  { name: "교통", type: "expense" },
  { name: "주거/통신", type: "expense" },
  { name: "쇼핑", type: "expense" },
  { name: "문화/여가", type: "expense" },
  { name: "의료/건강", type: "expense" },
  { name: "교육", type: "expense" },
  { name: "기타 지출", type: "expense" },
  { name: "예금", type: "asset" },
  { name: "적금", type: "asset" },
  { name: "주식/펀드", type: "asset" },
  { name: "현금", type: "asset" },
  { name: "기타 자산", type: "asset" },
  { name: "급여", type: "income" },
  { name: "부수입", type: "income" },
  { name: "기타 수입", type: "income" },
];

export async function fetchCategories(): Promise<Category[]> {
  const { data, error } = await supabase.from("categories").select("*").order("name");
  if (error) throw new Error(error.message);
  return (data ?? []) as Category[];
}

export async function seedDefaultCategories(): Promise<void> {
  const userId = await getCurrentUserId();
  if (!userId) throw new Error("로그인이 필요합니다.");
  const rows = DEFAULT_CATEGORIES.map(({ name, type }) => ({ name, type, user_id: userId }));
  const { error } = await supabase.from("categories").insert(rows as never);
  if (error) throw new Error(error.message);
}

export async function createCategory(payload: Omit<Insertable<"categories">, "id" | "user_id">): Promise<void> {
  const userId = await getCurrentUserId();
  if (!userId) throw new Error("로그인이 필요합니다.");
  const row: Insertable<"categories"> = { ...payload, user_id: userId };
  const { error } = await supabase.from("categories").insert(row as never);
  if (error) throw new Error(error.message);
}

export async function updateCategory(id: string, payload: Updatable<"categories">): Promise<void> {
  const { error } = await supabase
    .from("categories")
    .update(payload as never)
    .eq("id", id);
  if (error) throw new Error(error.message);
}

export async function deleteCategory(id: string): Promise<void> {
  const { error } = await supabase.from("categories").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

export { queryKeys as categoryQueryKeys };
