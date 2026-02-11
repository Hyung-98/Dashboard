import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  throw new Error("Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY");
}

export const supabase = createClient<Database>(url, anonKey);

/**
 * 모듈 레벨에서 PASSWORD_RECOVERY 이벤트를 캡처.
 * Supabase 클라이언트 초기화 시 URL 토큰을 처리하면서 발생하는 이벤트가
 * React useEffect 내 onAuthStateChange 리스너보다 먼저 발생할 수 있으므로,
 * 모듈 로드 시점에 즉시 구독하여 이벤트 유실을 방지한다.
 */
let _passwordRecoveryDetected = false;
supabase.auth.onAuthStateChange((event) => {
  if (event === "PASSWORD_RECOVERY") {
    _passwordRecoveryDetected = true;
  }
});

/** PASSWORD_RECOVERY 플래그를 읽고 초기화한다. */
export function consumePasswordRecoveryFlag(): boolean {
  const value = _passwordRecoveryDetected;
  _passwordRecoveryDetected = false;
  return value;
}

/** Returns the current user id for RLS. Uses getSession() so the id matches the JWT sent with the next request. */
export async function getCurrentUserId(): Promise<string | null> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session?.user?.id ?? null;
}
