/// <reference types="vite/client" />
/// <reference types="vitest/globals" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
  /** Sentry DSN (optional). 설정 시 ErrorBoundary 등에서 에러 모니터링. */
  readonly VITE_SENTRY_DSN?: string;
  /** Cloudflare Turnstile Site Key (optional). CAPTCHA 보호용. */
  readonly VITE_CAPTCHA_SITE_KEY?: string;
  /** CAPTCHA 활성화 여부 (optional). 'true' 또는 'false' (기본값: false). */
  readonly VITE_CAPTCHA_ENABLED?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
