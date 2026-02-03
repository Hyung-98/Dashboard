import { useEffect, useState, type ReactNode } from "react";
import { supabase } from "@/lib/supabase";
import { Login } from "@/pages/Login";

interface AuthInitProps {
  children: ReactNode;
}

/**
 * Shows login screen when there is no session; otherwise renders the app.
 * Listens to auth state changes so logging in/out updates the UI.
 */
export function AuthInit({ children }: AuthInitProps) {
  const [session, setSession] = useState<unknown | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      setReady(true);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
    });

    return () => subscription.unsubscribe();
  }, []);

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
