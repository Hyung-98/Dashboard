import { useEffect, useRef, useState, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/api/queryKeys";
import { supabase } from "@/lib/supabase";
import { Login } from "@/pages/Login";

interface AuthInitProps {
  children: ReactNode;
}

/**
 * Shows login screen when there is no session; otherwise renders the app.
 * Listens to auth state changes so logging in/out updates the UI.
 * Invalidates dashboard query cache when the user logs out or switches account.
 */
export function AuthInit({ children }: AuthInitProps) {
  const [session, setSession] = useState<unknown | null>(null);
  const [ready, setReady] = useState(false);
  const queryClient = useQueryClient();
  const previousUserIdRef = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      setReady(true);
      previousUserIdRef.current = s?.user?.id ?? null;
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, s) => {
      const newUserId = s?.user?.id ?? null;
      if (previousUserIdRef.current !== undefined && previousUserIdRef.current !== newUserId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.all });
      }
      previousUserIdRef.current = newUserId;
      setSession(s);
    });

    return () => subscription.unsubscribe();
  }, [queryClient]);

  if (!ready) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
          fontSize: "0.875rem",
          color: "#64748b",
        }}
      >
        로딩 중...
      </div>
    );
  }

  if (!session) {
    return <Login />;
  }

  return <>{children}</>;
}
