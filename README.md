# 개인 자산 관리 대시보드

TypeScript, React, TanStack Query, Apache ECharts, Supabase로 구현한 지출·예산·자산·수입·주식 관리 대시보드입니다.

## 목차

- [기술 스택](#기술-스택)
- [시작하기](#시작하기)
- [환경 변수](#환경-변수)
- [배포 (Netlify)](#배포-netlify)
- [로컬 개발 시 주의사항](#로컬-개발-시-주의사항)
- [Supabase](#supabase)
- [주요 기능](#주요-기능)
- [필수·권장 체크리스트](#필수권장-체크리스트)
- [디렉터리 구조](#디렉터리-구조)
- [라이선스](#라이선스)

## 기술 스택

| 구분      | 기술                       |
| --------- | -------------------------- |
| 빌드      | Vite + React 18            |
| 언어      | TypeScript (strict)        |
| 서버 상태 | TanStack Query v5          |
| 시각화    | Apache ECharts             |
| 백엔드    | Supabase (Auth + Database) |
| 라우팅    | React Router v6            |
| UI 문서   | Storybook 8                |
| 드래그앤드롭 | dnd-kit                 |
| 애니메이션 | lottie-react              |
| E2E 테스트 | Playwright               |

## 시작하기

```bash
# 의존성 설치
npm install

# 환경 변수 설정 (.env.example 참고하여 .env 생성)
cp .env.example .env

# 개발 서버
npm run dev

# 빌드
npm run build

# Storybook (공통 컴포넌트)
npm run storybook

# 테스트 (Vitest)
npm run test          # watch
npm run test:run      # 1회

# 번들 분석 (stats.html 생성)
npm run build:analyze
```

## 환경 변수

| 변수                         | 설명                                                                           |
| ---------------------------- | ------------------------------------------------------------------------------ |
| `VITE_SUPABASE_URL`          | Supabase 프로젝트 URL                                                          |
| `VITE_SUPABASE_ANON_KEY`     | Supabase anon (public) key                                                     |
| `VITE_CAPTCHA_SITE_KEY`      | (선택) Cloudflare Turnstile Site Key. 배포 시 봇/남용 방지용 CAPTCHA. [발급](https://dash.cloudflare.com/). 로컬 테스트 시 `1x00000000000000000000AA` (항상 통과) 사용 가능 |
| `VITE_CAPTCHA_ENABLED`       | (선택) CAPTCHA 활성화 여부 (`'true'` 또는 `'false'`, 기본값: `false`). 개발 환경에서는 `false` 권장 (로컬 테스트 시 `true` + 테스트 키 사용 가능) |
| `VITE_ALPHA_VANTAGE_API_KEY` | (선택) 미국 주식 시세용. [Alpha Vantage](https://www.alphavantage.co/) 무료 키 |
| `KIS_APP_KEY`                | (선택) 한국투자증권 KIS API 실전투자 앱키. 시세·주문 등 연동 시 사용           |
| `KIS_APP_SECRET`             | (선택) 한국투자증권 KIS API 실전투자 앱시크릿. 백엔드에서만 사용 권장          |
| `MOK_KIS_APP_KEY`            | (선택) 한국투자증권 KIS API 모의투자 앱키                                      |
| `MOK_KIS_APP_SECRET`         | (선택) 한국투자증권 KIS API 모의투자 앱시크릿. 백엔드에서만 사용 권장          |

## 배포 (Netlify)

1. **GitHub 연결** — Netlify Dashboard → Add new site → Import an existing project → 이 저장소 연결 후 브랜치(예: `main`) 선택.
2. **빌드** — Build command: `npm run build`, Publish directory: `dist`.
3. **SPA 라우팅** — `public/_redirects`에 `/* /index.html 200` 규칙이 포함되어 있어 새로고침 시 404가 발생하지 않습니다. Netlify가 빌드 산출물의 `_redirects`를 자동으로 적용합니다.
4. **HTTP 헤더(CSP)** — `public/_headers`에 CSP·HSTS·X-Frame-Options 등이 정의되어 있으며, Netlify가 빌드 시 자동으로 적용합니다. 별도 설정이 필요 없습니다.
5. **환경 변수** — Netlify Dashboard → Site configuration → Environment variables에서 `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` 추가.
6. **배포** — Deploy site. 커스텀 도메인은 Domain management에서 설정.

### 배포 후 사용하기 (KR 주식·DB·Auth)

배포된 앱이 **클라우드 Supabase**와 **KR 주식 현재가**를 쓰려면 아래를 모두 해 두어야 합니다.

| 순서 | 할 일                 | 설명                                                                                                                                                                                                                            |
| ---- | --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1    | Edge Function 배포    | `npx supabase functions deploy kis-kr-price` (프로젝트 연결 후 한 번)                                                                                                                                                           |
| 2    | Edge Function Secrets | Supabase Dashboard → **Project settings** → **Edge Functions** → **Secrets**에 `KIS_APP_KEY`, `KIS_APP_SECRET` 등록 (모의투자 시 `MOK_KIS_APP_KEY`, `MOK_KIS_APP_SECRET` 추가)                                                  |
| 3    | 프론트엔드 환경 변수  | Netlify Dashboard → Site configuration → Environment variables에서 **클라우드** Supabase 값 사용: `VITE_SUPABASE_URL=https://<프로젝트_REF>.supabase.co`, `VITE_SUPABASE_ANON_KEY=<클라우드_anon_key>` (Dashboard → Project settings → API에서 확인) |
| 4    | DB 스키마             | 원격 DB에 마이그레이션 적용: `npx supabase link --project-ref <REF>` 후 `npx supabase db push`                                                                                                                                  |
| 5    | CAPTCHA 설정 (권장)    | 배포 시 봇/남용 방지: [Cloudflare Dashboard](https://dash.cloudflare.com/)에서 Turnstile Site Key 발급 → 배포 환경 변수에 `VITE_CAPTCHA_SITE_KEY`와 `VITE_CAPTCHA_ENABLED=true` 설정 → [Supabase Dashboard](https://supabase.com/dashboard/project/_/auth/protection) → Authentication → Bot and Abuse Protection에서 CAPTCHA 활성화 및 Secret Key 설정 |
| 6    | Auth Redirect URLs     | 비밀번호 찾기·이메일 로그인 링크용: Supabase Dashboard → **Authentication** → **URL Configuration** → **Redirect URLs**에 배포 URL 추가. 예: `https://your-site.netlify.app/#/` (HashRouter이므로 끝에 `/#/` 포함). `VITE_APP_URL`을 쓰면 해당 값과 동일하게 추가. |

- **로컬에서만** 개발할 때는 `.env.local`에 로컬 URL(`http://127.0.0.1:54321`)을 두고, **배포 빌드**할 때는 Netlify 환경 변수에 클라우드 URL을 넣으면 됩니다. (`.env.local`은 빌드 서버에 없으므로 Netlify에 반드시 설정)
- KR 종목 현재가가 안 나오면: Edge Function 배포 여부, Secrets 등록, 그리고 프론트가 **클라우드** Supabase URL을 쓰는지 확인하세요.

### 로컬 개발 시 주의사항

로컬에서 개발할 때 다음 사항을 확인하세요:

1. **로컬 Supabase 시작**

   - `npx supabase start` 실행 (최초 1회)
   - 로컬 Supabase가 `http://127.0.0.1:54321`에서 실행됩니다

2. **환경 변수 설정**

   - `.env.local` 파일에 로컬 Supabase URL 설정:
     ```
     VITE_SUPABASE_URL=http://127.0.0.1:54321
     VITE_SUPABASE_ANON_KEY=<로컬_anon_key>
     ```
   - 로컬 anon key는 `npx supabase start` 실행 후 터미널 출력에서 확인하거나 `supabase status` 명령으로 확인 가능합니다

3. **마이그레이션 적용**

   - 로컬 DB에 마이그레이션 적용: `npx supabase migration up`
   - 또는 `npx supabase db reset`으로 초기화 후 마이그레이션 자동 적용

4. **Edge Function 로컬 실행** (KR 주식 현재가 사용 시)

   - `supabase functions serve kis-kr-price --no-verify-jwt --env-file .env.local`
   - `.env.local`에 `KIS_APP_KEY`, `KIS_APP_SECRET` 등이 있어야 합니다
   - 로컬 함수는 `http://127.0.0.1:54321/functions/v1/kis-kr-price`에서 실행됩니다

5. **CAPTCHA 테스트** (선택)
   - 로컬에서 CAPTCHA를 테스트하려면 Cloudflare Turnstile의 **테스트 키**를 사용할 수 있습니다
   - `.env.local`에 다음을 추가:
     ```
     VITE_CAPTCHA_SITE_KEY=1x00000000000000000000AA
     VITE_CAPTCHA_ENABLED=true
     ```
   - 테스트 키 설명:
     - `1x00000000000000000000AA`: 항상 통과 (보이는 위젯)
     - `2x00000000000000000000AB`: 항상 실패 (보이는 위젯)
     - `1x00000000000000000000BB`: 항상 통과 (보이지 않는 위젯)
     - `3x00000000000000000000FF`: 강제 인터랙티브 챌린지 (보이는 위젯)
   - Supabase Dashboard에서도 테스트 Secret Key (`1x0000000000000000000000000000000AA`)를 사용할 수 있습니다
   - **참고**: 개발 편의를 위해 로컬에서는 `VITE_CAPTCHA_ENABLED=false`로 비활성화하는 것을 권장합니다

6. **주의사항**
   - `.env.local`은 Git에 커밋하지 마세요 (`.gitignore`에 포함되어야 함)
   - 배포 빌드 시에는 `.env.local`이 사용되지 않으므로 Netlify 환경 변수에 별도로 설정해야 합니다
   - 로컬과 클라우드 Supabase는 별개의 데이터베이스이므로 데이터가 공유되지 않습니다
   - 로컬에서 테스트한 후 클라우드에도 동일한 마이그레이션을 적용해야 합니다

### 배포 후 자주 나는 오류

| 증상                                    | 원인                                                              | 조치                                                                                                                                                                                            |
| --------------------------------------- | ----------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **하위 경로에서 404**                   | `_redirects` 파일이 빌드 산출물에 없으면 서버가 경로를 찾지 못함  | `public/_redirects`에 `/* /index.html 200`이 있는지 확인. Netlify는 `dist/_redirects`를 자동 적용.                                                                                              |
| **Sandbox / allow-scripts 콘솔 에러**   | Turnstile(CAPTCHA) iframe이 CSP에 의해 스크립트 실행 차단         | `public/_headers`의 `frame-src`·`script-src`에 `https://challenges.cloudflare.com`가 포함되어 있는지 확인. 파일이 `dist/`에 복사되어 Netlify에 배포되어야 합니다.                               |
| **비밀번호 찾기 시 `/auth/v1/recover` 500** | 비밀번호 재설정 링크의 redirect URL이 Supabase 허용 목록에 없음   | Supabase Dashboard → **Authentication** → **URL Configuration** → **Redirect URLs**에 배포 URL을 **정확히** 추가. 예: `https://your-site.netlify.app/#/` (HashRouter이므로 `/#/` 포함). 배포 도메인이 다르면 해당 URL도 추가. |
| **`kis-kr-price` 502 (Bad Gateway)**    | Edge Function 미배포 또는 Secrets 미설정                          | ① `npx supabase functions deploy kis-kr-price` 실행 ② Supabase Dashboard → **Project settings** → **Edge Functions** → **Secrets**에 `KIS_APP_KEY`, `KIS_APP_SECRET` 등록 후 재배포 없이 반영됨 |

**502가 계속 날 때** — 원인 확인 순서:

1. **브라우저 콘솔**  
   배포된 앱에서 F12 → **Console**. `kis-kr-price: ...` 로그에 함수가 돌려준 메시지가 찍힙니다.

   - `KIS_APP_KEY / KIS_APP_SECRET not set` → Secrets 미등록 또는 이름 오타 (`KIS_APP_KEY`, `KIS_APP_SECRET` 정확히)
   - `KIS token failed: 401` → KIS 앱키/시크릿이 잘못됐거나 만료. [KIS 개발자포털](https://apiportal.koreainvestment.com/)에서 확인
   - `KIS token failed: 403` + "접근토큰 발급 잠시 후 다시 시도하세요(1분당 1회)" → KIS가 **접근토큰 발급을 1분당 1회**로 제한함. Edge Function은 동시 요청 시 토큰 요청을 직렬화하므로, 1분 정도 지난 뒤 다시 시도하거나 프론트에서 KR 시세 조회 빈도를 줄이면 됨.
   - `KIS price failed: ...` → KIS 시세 API 권한/tr_id 문제. 포털 API 가이드 참고

2. **Supabase 함수 로그**  
   Supabase Dashboard → **Edge Functions** → **kis-kr-price** → **Logs** (또는 **Invocations**). 여기서 타임아웃·크래시·에러 스택 확인.

3. **배포·연결 확인**  
   터미널에서 `npx supabase functions list` 로 해당 프로젝트에 `kis-kr-price`가 보이는지 확인. 안 보이면 `npx supabase link --project-ref <프로젝트_REF>` 후 `npx supabase functions deploy kis-kr-price` 다시 실행.

## Supabase

### KR 주식 현재가 (Edge Function)

KR 종목 현재가를 사용하려면 [한국투자증권 KIS API](https://apiportal.koreainvestment.com/) 앱키·앱시크릿을 Supabase Edge Function Secrets에 등록하고 `kis-kr-price` 함수를 배포해야 합니다. 한국(KR) 종목 현재가는 Supabase Edge Function `kis-kr-price`를 통해 KIS API를 호출하며, 앱시크릿은 클라이언트에 노출되지 않도록 Edge Function에서만 사용합니다.

1. **Edge Function 배포**  
   Supabase CLI로 배포: `supabase functions deploy kis-kr-price`
2. **로컬에서 함수 실행** (선택)  
   `supabase start` 후, KIS 키를 넘기려면 `--env-file`을 사용합니다.  
   `supabase functions serve kis-kr-price --no-verify-jwt --env-file .env.local`  
   (`.env.local`에 `KIS_APP_KEY`, `KIS_APP_SECRET` 등이 있어야 합니다.)
3. **Secrets 설정**  
   Supabase Dashboard → Project Settings → Edge Functions → Secrets에 다음을 등록:
   - `KIS_APP_KEY` — 실전투자 앱키 (필수)
   - `KIS_APP_SECRET` — 실전투자 앱시크릿 (필수)
   - (선택) 모의투자: `MOK_KIS_APP_KEY`, `MOK_KIS_APP_SECRET`  
     프론트에서 `body: { symbol, demo: true }`로 호출하면 모의 키를 사용합니다.

미배포 또는 Secrets 미설정 시 KR 종목 현재가/평가금액은 표시되지 않습니다.

### 스키마 요약

| 마이그레이션                                      | 내용                                  |
| ------------------------------------------------- | ------------------------------------- |
| `20250202000000_initial_schema.sql`               | categories, expenses, budgets, assets |
| `20250202100000_incomes.sql`                      | incomes 테이블                        |
| `20250203100000_check_email_exists.sql`           | 회원가입 이메일 중복 확인 RPC         |
| `20250203110000_categories_global.sql`            | categories 전역화                     |
| `20250204100000_stock_holdings.sql`               | stock_holdings (주식 보유)            |
| `20250204110000_kis_token_cache.sql`              | KIS 토큰 캐시                         |
| `20250205100000_recurrence_expenses_incomes.sql`  | 지출/수입 반복 설정                   |
| `20250205110000_savings_goals.sql`                | savings_goals (저축 목표)             |
| `20250205120000_stock_transactions.sql`           | stock_transactions (주식 거래 내역)   |
| `20260211161500_portfolio_targets.sql`            | portfolio_targets (포트폴리오 목표 비중) |
| `20260212161300_fix_categories_rls.sql`           | categories RLS 정책 수정              |
| `20260212161700_add_exchange_column.sql`          | stock_holdings exchange 컬럼 추가     |

**테이블**: categories(카테고리), expenses(지출), budgets(예산), assets(자산), incomes(수입), stock_holdings(주식 보유), savings_goals(저축 목표), stock_transactions(주식 거래), portfolio_targets(포트폴리오 목표 비중).
RLS로 `auth.uid()` = `user_id` 기준 사용자별 데이터 격리.

### 마이그레이션 적용

**CLI (권장)**

```bash
npx supabase login
npx supabase link --project-ref <프로젝트_REF>
npx supabase db push
```

로컬 Supabase 사용 시: `npx supabase start` 후 `npx supabase migration up`.

**원격 DB에 이미 테이블이 있는 경우** (처음 push 시 "relation already exists" 나올 때):

```bash
npx supabase migration repair --status applied 20250202000000
npx supabase migration repair --status applied 20250202100000
npx supabase db push
```

**대시보드**: SQL Editor에서 `supabase/migrations/` 내 `.sql`을 **순서대로** 실행. 적용 여부는 Database → Migrations에서 확인.

### 인증

- **이메일/비밀번호** 로그인·회원가입. 회원가입 시 비밀번호 강도·비밀번호 확인·이메일 중복 확인·약관 동의 적용.
- **익명으로 체험하기**: 로그인 화면에서 계정 없이 체험 가능. 아래에서 Supabase Anonymous 제공자를 켜야 동작합니다.
- **CAPTCHA 보호**: 배포 시 Cloudflare Turnstile을 통한 봇/남용 방지. 개발 환경에서는 환경 변수로 비활성화 가능.

#### 익명으로 체험하기 활성화

앱의 "익명으로 체험하기" 버튼이 동작하려면 Supabase에서 **Anonymous**를 켜야 합니다.

- **로컬 Supabase** (`npx supabase start`): 이 저장소의 `supabase/config.toml`에 이미 `enable_anonymous_sign_ins = true`가 설정되어 있습니다. **한 번 `npx supabase stop` 후 `npx supabase start`로 다시 띄우면** 익명 로그인이 적용됩니다.
- **호스트 Supabase** (배포/클라우드):
  1. [Supabase Dashboard](https://supabase.com/dashboard) → 사용 중인 프로젝트 선택
  2. **Authentication** → **Providers**
  3. **Anonymous** → **Enable** 토글 켜기
  4. (선택) **Authentication** → **Rate Limits** 확인, 필요 시 [CAPTCHA](https://supabase.com/docs/guides/auth/auth-captcha) 활성화

동작하지 않으면 로그인 화면에 표시되는 에러 메시지(예: "Supabase 대시보드 → Authentication → Providers에서 Anonymous를 켜 주세요")를 확인한 뒤, 위 설정을 적용하세요. 익명 사용자도 `auth.uid()`로 RLS가 적용된 테이블(지출·예산·자산 등)에 본인 데이터만 읽기/쓰기 가능합니다.

## 주요 기능

| 기능                | 설명                                                                                                                                      |
| ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| **인증**            | 로그인/회원가입, 한글 에러 메시지, 비밀번호 강도·확인·이메일 중복 확인·약관 동의, 익명 로그인                                             |
| **복합 필터 + URL** | `useExpenseFilters` / `useIncomeFilters`로 날짜·카테고리·금액 필터를 URL 쿼리와 동기화                                                    |
| **주식**            | 보유 종목(종목코드·시장 KR/US·수량·평균매수가) 등록, 미국 종목 시세(Alpha Vantage) 연동, 평가금액·손익 표시, 거래 내역, 포트폴리오 리밸런싱 차트(현재 비중·목표 비중 도넛 차트), 대시보드 요약·자산 파이 반영 |
| **리포트**          | 기간별 수입/지출 요약 및 차트, 지출 내역 CSV 내보내기                                                                                    |
| **테마**            | 라이트/다크 모드 전환, localStorage에 설정 저장 (`src/contexts/ThemeContext.tsx`)                                                         |
| **설정**            | 예산 초과 알림, 기본 차트 기간, 테마 선택 — localStorage 저장                                                                            |
| **공통 UI**         | Table, Modal, Select, DateRangePicker, Skeleton — Storybook 스토리로 문서화                                                               |
| **에러 처리**       | Error Boundary, API 실패 시 인라인 한글 메시지                                                                                            |
| **스켈레톤**        | 로딩 시 TableSkeleton, CardSkeleton                                                                                                       |
| **데이터 시각화**   | Apache ECharts로 대시보드 월별 지출 추이(LineChart), 카테고리별 비율(PieChart)                                                                  |
| **타입**            | DB/도메인/필터 타입 정의 (`src/types/`), TanStack Query 캐시 (`src/api/`)                                                                 |

| 구분 | 구현 내용 | 산출물/사용법 |
|------|-----------|----------------|
| **1. 단위/통합 테스트** | Vitest + React Testing Library. `vite.config.ts`에 test 블록(jsdom, `@` alias, setup), `src/test/setup.ts`에서 `@testing-library/jest-dom` 로드. | `npm run test` (watch), `npm run test:run` (1회). `src/types/filters.test.ts`(parse/직렬화·경계값·숫자 파싱), `src/hooks/useExpenseFilters.test.tsx`(URL 동기화·setFilters) |
| **2. CI** | GitHub Actions로 `main`/`develop` 푸시·PR 시 두 잡 실행. ① `quality`: Node 20, `npm ci` → `lint` → `build` → `test:run`. ② `e2e`: Playwright Chromium 설치 후 `npm run e2e` (VITE_SUPABASE_URL·ANON_KEY는 GitHub Secrets에서 주입). | `.github/workflows/ci.yml` |
| **3. Form 스토리** | Storybook preview에 `QueryClientProvider` + `MemoryRouter` 전역 decorator. `QueryClient`의 `defaultOptions.queries.queryFn`으로 categories/budgets mock 반환해 API 없이 폼 렌더. | `.storybook/preview.tsx`, `.storybook/mocks.ts`, `src/components/forms/ExpenseForm.stories.tsx`, `IncomeForm.stories.tsx`, `SavingsGoalForm.stories.tsx`, `StockTransactionForm.stories.tsx` (빈 폼 / 수정용 initialData). `npm run storybook` |
| **4. 에러 모니터링 (Sentry)** | 선택. `VITE_SENTRY_DSN` 설정 시에만 `main.tsx`에서 `Sentry.init()`. `ErrorBoundary`의 `componentDidCatch`에서 `Sentry.captureException(error)` 호출. | `.env`에 `VITE_SENTRY_DSN` 추가 시 활성화. `.env.example`·`src/vite-env.d.ts`에 설명·타입 |
| **7. E2E 테스트 (Playwright)** | Playwright로 주요 사용자 흐름 검증. 앱 로드, 지출 페이지 이동, 리포트 페이지 이동 시나리오 포함. 익명 로그인이 불가한 환경에서는 자동 스킵. | `e2e/app.spec.ts`. `npm run e2e` (헤드리스), `npm run e2e:ui` (UI 모드) |
| **5. 접근성 (a11y)** | Storybook에 `@storybook/addon-a11y` 추가. Modal/Select/DateRangePicker 등 UI 스토리에서 Accessibility 패널로 경고 확인. | `.storybook/main.ts` addons. 스토리 실행 후 "Accessibility" 탭 |
| **6. 번들 분석** | `rollup-plugin-visualizer`를 `ANALYZE` 환경 변수로만 활성화. 분석 시 `stats.html`(gzip 크기 포함) 생성. | `npm run build:analyze` → 프로젝트 루트 `stats.html`. `.gitignore`에 `stats.html` 포함 |

**미구현/선택 사항**

- Sentry 소스맵 업로드: 배포 빌드 시 Vite 플러그인 또는 CLI로 업로드 설정은 Sentry 문서 참고.
- Supabase 보안 어드바이저: 코드 변경 없이 **Supabase Dashboard → Advisors**에서 수동 확인·조치.
- Dependabot/Renovate, PWA, i18n: 플랜 범위 밖. 필요 시 별도 진행.

## 디렉터리 구조

```
src/
  api/           # queryKeys, expenses, budgets, assets, stocks, stockPrice, stockTransactions, portfolioTargets, categories, incomes, savingsGoals, hooks
  assets/
    lottie/      # CatLoader.json, ReactLogo.json (Lottie 애니메이션)
  components/
    ui/          # Table, Modal, Select, DateRangePicker, Skeleton (+ .stories)
    forms/       # AssetForm, BudgetForm, CategoryForm, ExpenseForm, IncomeForm, StockForm, StockTransactionForm, SavingsGoalForm, PortfolioTargetForm
    PortfolioAllocationCharts.tsx
    AuthInit.tsx
    ErrorBoundary.tsx
    Layout.tsx
  contexts/      # ThemeContext.tsx (라이트/다크 테마)
  hooks/         # useExpenseFilters, useIncomeFilters
  lib/           # supabase.ts, authErrors.ts, csvExport.ts, settings.ts, toSixDigitSymbol.test.ts
  pages/         # Dashboard, Expenses, Budgets, Assets, Stocks, Categories, Incomes, Login, Settings, SavingsGoals, Report
  types/         # database, domain, filters, api
  App.tsx, main.tsx
e2e/             # app.spec.ts (Playwright E2E 테스트)
```

## 라이선스

MIT
