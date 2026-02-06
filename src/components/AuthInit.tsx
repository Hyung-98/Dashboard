import { useEffect, useRef, useState, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/api/queryKeys";
import { supabase } from "@/lib/supabase";
import { getAuthErrorMessage } from "@/lib/authErrors";
import { Login } from "@/pages/Login";

interface AuthInitProps {
  children: ReactNode;
}

/**
 * Shows login screen when there is no session; otherwise renders the app.
 * Listens to auth state changes so logging in/out updates the UI.
 * Handles PASSWORD_RECOVERY: shows "새 비밀번호 입력" form when user returns from reset link.
 */
export function AuthInit({ children }: AuthInitProps) {
  const [session, setSession] = useState<unknown | null>(null);
  const [ready, setReady] = useState(false);
  const [needsNewPassword, setNeedsNewPassword] = useState(false);
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
    } = supabase.auth.onAuthStateChange((event, s) => {
      if (event === "PASSWORD_RECOVERY") {
        setNeedsNewPassword(true);
      }
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

  if (needsNewPassword) {
    return <ResetPasswordForm onDone={() => setNeedsNewPassword(false)} />;
  }

  return <>{children}</>;
}

function ResetPasswordForm({ onDone }: { onDone: () => void }) {
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    if (password.length < 8) {
      setError("비밀번호는 8자 이상이어야 합니다.");
      return;
    }
    if (password !== passwordConfirm) {
      setError("비밀번호가 일치하지 않습니다.");
      return;
    }
    setLoading(true);
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) throw updateError;
      setMessage("비밀번호가 변경되었습니다.");
      setTimeout(onDone, 1500);
    } catch (err) {
      setError(getAuthErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h1>새 비밀번호 입력</h1>
        <form onSubmit={handleSubmit} aria-describedby={error ? "reset-error" : message ? "reset-message" : undefined}>
          {error && (
            <div id="reset-error" className="error-alert" role="alert" style={{ marginBottom: "1rem" }}>
              {error}
            </div>
          )}
          {message && (
            <div id="reset-message" className="message-success" role="status">
              {message}
            </div>
          )}
          <div className="form-field">
            <label htmlFor="new-password" className="form-label">새 비밀번호</label>
            <input
              id="new-password"
              type="password"
              className="input-text"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="8자 이상, 영문·숫자·특수문자 포함"
              required
              minLength={8}
              autoComplete="new-password"
              disabled={loading}
            />
          </div>
          <div className="form-field">
            <label htmlFor="new-password-confirm" className="form-label">비밀번호 확인</label>
            <input
              id="new-password-confirm"
              type="password"
              className="input-text"
              value={passwordConfirm}
              onChange={(e) => setPasswordConfirm(e.target.value)}
              placeholder="비밀번호를 다시 입력하세요"
              required
              autoComplete="new-password"
              disabled={loading}
            />
          </div>
          <button type="submit" className="btn-primary" disabled={loading} style={{ width: "100%", padding: "0.75rem 1rem" }}>
            {loading ? "저장 중..." : "비밀번호 변경"}
          </button>
        </form>
      </div>
    </div>
  );
}
