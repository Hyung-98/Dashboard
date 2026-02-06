import { useState, useRef } from "react";
import { isAuthApiError } from "@supabase/supabase-js";
import { Turnstile, type TurnstileInstance } from "@marsidev/react-turnstile";
import { ANONYMOUS_SIGNIN_SERVER_ERROR_MESSAGE, getAuthErrorMessage } from "@/lib/authErrors";
import { supabase } from "@/lib/supabase";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateEmail(value: string): string | null {
  if (!value.trim()) return "이메일을 입력해 주세요.";
  if (!EMAIL_REGEX.test(value)) return "올바른 이메일 형식이 아닙니다.";
  return null;
}

function validatePasswordStrength(value: string): string | null {
  if (value.length < 8) return "비밀번호는 8자 이상이어야 합니다.";
  if (!/[a-zA-Z]/.test(value)) return "비밀번호에 영문을 포함해 주세요.";
  if (!/[0-9]/.test(value)) return "비밀번호에 숫자를 포함해 주세요.";
  if (!/[^a-zA-Z0-9]/.test(value)) return "비밀번호에 특수문자를 포함해 주세요.";
  return null;
}

export function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [termsAgreed, setTermsAgreed] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [emailCheckStatus, setEmailCheckStatus] = useState<null | "checking" | "available" | "taken" | "error">(null);
  const [emailCheckedAt, setEmailCheckedAt] = useState("");
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const captchaRef = useRef<TurnstileInstance | null>(null);
  const anonymousCaptchaRef = useRef<TurnstileInstance | null>(null);

  // CAPTCHA 활성화 여부 확인
  const captchaSiteKey = import.meta.env.VITE_CAPTCHA_SITE_KEY;
  const captchaEnabled = import.meta.env.VITE_CAPTCHA_ENABLED === "true" && captchaSiteKey;

  const handleCheckEmailDuplicate = async () => {
    const emailError = validateEmail(email);
    if (emailError) {
      setError(emailError);
      return;
    }
    setError(null);
    setEmailCheckStatus("checking");
    try {
      const { data, error: rpcError } = await supabase.rpc("check_email_exists", {
        check_email: email.trim().toLowerCase(),
      } as never);
      if (rpcError) {
        setEmailCheckStatus("error");
        setError("중복 확인 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.");
        return;
      }
      setEmailCheckedAt(email.trim().toLowerCase());
      setEmailCheckStatus(data ? "taken" : "available");
      if (data) setError("이미 사용 중인 이메일입니다.");
    } catch {
      setEmailCheckStatus("error");
      setError("중복 확인 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);

    if (isSignUp) {
      const emailError = validateEmail(email);
      if (emailError) {
        setError(emailError);
        return;
      }
      const normalizedEmail = email.trim().toLowerCase();
      if (emailCheckedAt !== normalizedEmail || emailCheckStatus === "taken") {
        setError("이메일 중복 확인을 해 주세요.");
        return;
      }
      if (emailCheckStatus !== "available") {
        setError("이메일 중복 확인을 해 주세요.");
        return;
      }
      const passwordError = validatePasswordStrength(password);
      if (passwordError) {
        setError(passwordError);
        return;
      }
      if (password !== passwordConfirm) {
        setError("비밀번호가 일치하지 않습니다.");
        return;
      }
      if (!termsAgreed) {
        setError("이용약관 및 개인정보 수집·이용에 동의해 주세요.");
        return;
      }
    } else {
      const emailError = validateEmail(email);
      if (emailError) {
        setError(emailError);
        return;
      }
    }

    // CAPTCHA 검증 (활성화된 경우)
    if (captchaEnabled && isSignUp && !captchaToken) {
      setError("보안 검증을 완료해 주세요.");
      return;
    }

    setLoading(true);
    try {
      if (isSignUp) {
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          ...(captchaEnabled && captchaToken ? { options: { captchaToken } } : {}),
        });
        if (signUpError) throw signUpError;
        setMessage("가입 확인 메일을 보냈습니다. 이메일에서 링크를 눌러 확인해 주세요.");
        // CAPTCHA 리셋
        if (captchaEnabled) {
          captchaRef.current?.reset();
          setCaptchaToken(null);
        }
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
        if (signInError) throw signInError;
        // Session is set; AuthInit will re-render and show App
      }
    } catch (err) {
      setError(getAuthErrorMessage(err));
      // 에러 발생 시 CAPTCHA 리셋
      if (captchaEnabled && isSignUp) {
        captchaRef.current?.reset();
        setCaptchaToken(null);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    const emailError = validateEmail(email);
    if (emailError) {
      setError(emailError);
      return;
    }
    setLoading(true);
    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
        redirectTo: `${window.location.origin}${window.location.pathname || "/"}#/`,
      });
      if (resetError) throw resetError;
      setMessage("비밀번호 재설정 링크를 이메일로 보냈습니다. 메일함을 확인해 주세요.");
    } catch (err) {
      setError(getAuthErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleAnonymousLogin = async () => {
    setError(null);
    setMessage(null);

    // CAPTCHA 검증 (활성화된 경우)
    if (captchaEnabled && !captchaToken) {
      setError("보안 검증을 완료해 주세요.");
      return;
    }

    setLoading(true);
    try {
      const { data: { session }, error: anonError } = await supabase.auth.signInAnonymously(
        captchaEnabled && captchaToken ? { options: { captchaToken } } : undefined
      );
      if (anonError) throw anonError;
      if (!session) throw new Error("Anonymous login failed");
      // 세션 설정됨 → AuthInit의 onAuthStateChange가 감지해 앱으로 전환
      // CAPTCHA 리셋
      if (captchaEnabled) {
        anonymousCaptchaRef.current?.reset();
        setCaptchaToken(null);
      }
    } catch (err) {
      // 500 on signup often means Anonymous Sign-In is disabled in Supabase Dashboard
      const message: string =
        isAuthApiError(err) && err.status === 500
          ? ANONYMOUS_SIGNIN_SERVER_ERROR_MESSAGE
          : getAuthErrorMessage(err);
      setError(message);
      // 에러 발생 시 CAPTCHA 리셋
      if (captchaEnabled) {
        anonymousCaptchaRef.current?.reset();
        setCaptchaToken(null);
      }
    } finally {
      setLoading(false);
    }
  };

  const errorId = "login-error";
  const messageId = "login-message";

  if (isForgotPassword) {
    return (
      <div className="login-container">
        <div className="login-card">
          <h1>비밀번호 찾기</h1>
          <form onSubmit={handleForgotPassword} aria-describedby={error ? errorId : message ? messageId : undefined}>
            {error && (
              <div id={errorId} className="error-alert" role="alert" style={{ marginBottom: "1rem" }}>
                {error}
              </div>
            )}
            {message && (
              <div id={messageId} className="message-success" role="status">
                {message}
              </div>
            )}
            <div className="form-field">
              <label htmlFor="forgot-email" className="form-label">이메일</label>
              <input
                id="forgot-email"
                type="email"
                className="input-text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                autoComplete="email"
                disabled={loading}
              />
            </div>
            <button type="submit" className="btn-primary" disabled={loading} style={{ width: "100%", padding: "0.75rem 1rem" }}>
              {loading ? "처리 중..." : "재설정 링크 보내기"}
            </button>
          </form>
          <button
            type="button"
            className="btn-secondary-block"
            onClick={() => {
              setIsForgotPassword(false);
              setError(null);
              setMessage(null);
            }}
          >
            로그인으로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="login-container">
      <div className="login-card">
        <h1>{isSignUp ? "회원가입" : "로그인"}</h1>

        <form onSubmit={handleSubmit} aria-describedby={error ? errorId : message ? messageId : undefined}>
          {error && (
            <div id={errorId} className="error-alert" role="alert" aria-live="assertive" style={{ marginBottom: "1rem" }}>
              {error}
            </div>
          )}
          {message && (
            <div id={messageId} className="message-success" role="status" aria-live="polite">
              {message}
            </div>
          )}

          <div className="form-field">
            <label htmlFor="login-email" className="form-label">
              이메일
            </label>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <input
                id="login-email"
                type="email"
                className="input-text"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (emailCheckedAt) {
                    setEmailCheckStatus(null);
                    setEmailCheckedAt("");
                  }
                }}
                placeholder="you@example.com"
                required
                autoComplete="email"
                aria-required="true"
                aria-invalid={!!error}
                style={{ flex: 1 }}
              />
              {isSignUp && (
                <button
                  type="button"
                  className="btn-secondary"
                  disabled={loading || emailCheckStatus === "checking"}
                  onClick={handleCheckEmailDuplicate}
                  style={{ whiteSpace: "nowrap", padding: "0.75rem 1rem" }}
                >
                  {emailCheckStatus === "checking" ? "확인 중..." : "중복 확인"}
                </button>
              )}
            </div>
            {isSignUp && emailCheckStatus === "available" && (
              <div className="login-helper success" role="status">
                사용 가능한 이메일입니다.
              </div>
            )}
            {isSignUp && emailCheckStatus === "taken" && (
              <div className="login-helper error" role="alert">
                이미 사용 중인 이메일입니다.
              </div>
            )}
          </div>
          <div className="form-field">
            <label htmlFor="login-password" className="form-label">
              비밀번호
              {isSignUp && (
                <span style={{ fontWeight: 400, color: "var(--color-text-secondary)", fontSize: "0.8125rem" }}>
                  {" "}
                  (8자 이상, 영문·숫자·특수문자 포함)
                </span>
              )}
            </label>
            <input
              id="login-password"
              type="password"
              className="input-text"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              minLength={isSignUp ? 8 : 6}
              autoComplete={isSignUp ? "new-password" : "current-password"}
              aria-required="true"
              aria-invalid={!!error}
            />
          </div>
          {isSignUp && (
            <>
              <div className="form-field">
                <label htmlFor="login-password-confirm" className="form-label">
                  비밀번호 확인
                </label>
                <input
                  id="login-password-confirm"
                  type="password"
                  className="input-text"
                  value={passwordConfirm}
                  onChange={(e) => setPasswordConfirm(e.target.value)}
                  placeholder="비밀번호를 다시 입력하세요"
                  required={isSignUp}
                  autoComplete="new-password"
                  aria-required="true"
                  aria-invalid={!!error}
                />
              </div>
              <div className="form-field" style={{ marginBottom: "1.25rem" }}>
                <label className="checkbox-label" htmlFor="login-terms">
                  <input
                    id="login-terms"
                    type="checkbox"
                    checked={termsAgreed}
                    onChange={(e) => setTermsAgreed(e.target.checked)}
                    aria-required="true"
                    aria-invalid={!!error}
                  />
                  이용약관 및 개인정보 수집·이용에 동의합니다
                </label>
              </div>
              {captchaEnabled && (
                <div className="form-field" style={{ marginBottom: "1rem" }}>
                  <Turnstile
                    ref={captchaRef}
                    siteKey={captchaSiteKey}
                    onSuccess={(token) => setCaptchaToken(token)}
                    onError={() => {
                      setCaptchaToken(null);
                      setError("보안 검증에 실패했습니다. 다시 시도해 주세요.");
                    }}
                    onExpire={() => {
                      setCaptchaToken(null);
                    }}
                  />
                </div>
              )}
            </>
          )}

          <button type="submit" className="btn-primary" disabled={loading} style={{ width: "100%", padding: "0.75rem 1rem" }}>
            {loading ? "처리 중..." : isSignUp ? "가입" : "로그인"}
          </button>
        </form>

        {!isSignUp && (
          <button
            type="button"
            className="btn-outline-block"
            style={{ marginTop: "0.5rem" }}
            onClick={() => {
              setIsForgotPassword(true);
              setError(null);
              setMessage(null);
            }}
          >
            비밀번호 찾기
          </button>
        )}

        <button
          type="button"
          className="btn-secondary-block"
          onClick={() => {
            setIsSignUp((v) => !v);
            setError(null);
            setMessage(null);
            setPasswordConfirm("");
            setTermsAgreed(false);
            setEmailCheckStatus(null);
            setEmailCheckedAt("");
          }}
        >
          {isSignUp ? "이미 계정이 있으신가요? 로그인" : "계정이 없으신가요? 회원가입"}
        </button>

        {captchaEnabled && (
          <div style={{ marginBottom: "1rem" }}>
            <Turnstile
              ref={anonymousCaptchaRef}
              siteKey={captchaSiteKey}
              onSuccess={(token) => setCaptchaToken(token)}
              onError={() => {
                setCaptchaToken(null);
                setError("보안 검증에 실패했습니다. 다시 시도해 주세요.");
              }}
              onExpire={() => {
                setCaptchaToken(null);
              }}
            />
          </div>
        )}
        <button
          type="button"
          className="btn-outline-block"
          disabled={loading}
          onClick={handleAnonymousLogin}
          aria-label="익명으로 체험하기"
        >
          익명으로 체험하기
        </button>
      </div>
    </div>
  );
}
