import { isAuthApiError } from "@supabase/supabase-js";

const AUTH_ERROR_MESSAGES: Record<string, string> = {
  invalid_credentials: "이메일 또는 비밀번호가 올바르지 않습니다.",
  email_not_confirmed: "이메일 인증이 완료되지 않았습니다. 메일함을 확인해 주세요.",
  user_not_found: "해당 사용자를 찾을 수 없습니다.",
  email_exists: "이미 사용 중인 이메일입니다.",
  user_already_exists: "이미 가입된 이메일 또는 전화번호입니다.",
  weak_password: "비밀번호가 요구 조건을 만족하지 않습니다. (예: 8자 이상, 영문·숫자·특수문자 포함)",
  email_provider_disabled: "회원가입이 일시적으로 중단되었습니다.",
  signup_disabled: "회원가입이 일시적으로 중단되었습니다.",
  over_email_send_rate_limit: "요청이 너무 많습니다. 잠시 후 다시 시도해 주세요.",
  over_request_rate_limit: "요청이 너무 많습니다. 잠시 후 다시 시도해 주세요.",
  anonymous_provider_disabled:
    "익명 로그인이 비활성화되어 있습니다. Supabase 대시보드 → Authentication → Providers에서 Anonymous를 켜 주세요.",
  validation_failed: "입력값 형식이 올바르지 않습니다.",
  email_address_invalid: "지원하지 않는 이메일 주소입니다. 다른 이메일을 사용해 주세요.",
  email_address_not_authorized: "이 이메일로는 가입할 수 없습니다. SMTP 설정을 확인해 주세요.",
  session_expired: "세션이 만료되었습니다. 다시 로그인해 주세요.",
  session_not_found: "세션을 찾을 수 없습니다. 다시 로그인해 주세요.",
  unexpected_failure: "일시적인 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.",
};

/** Shown when anonymous sign-in returns 500 (often because Anonymous is disabled in dashboard). */
export const ANONYMOUS_SIGNIN_SERVER_ERROR_MESSAGE: string =
  AUTH_ERROR_MESSAGES["anonymous_provider_disabled"] ??
  "익명 로그인이 비활성화되어 있습니다. Supabase 대시보드 → Authentication → Providers에서 Anonymous를 켜 주세요.";

const DEFAULT_MESSAGE = "일시적인 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.";

/**
 * Supabase Auth 에러를 한글 메시지로 변환합니다.
 * AuthApiError인 경우 error.code로 매핑하고, 그 외에는 기본 메시지를 반환합니다.
 */
export function getAuthErrorMessage(error: unknown): string {
  if (isAuthApiError(error) && error.code) {
    return AUTH_ERROR_MESSAGES[error.code] ?? DEFAULT_MESSAGE;
  }
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return DEFAULT_MESSAGE;
}
