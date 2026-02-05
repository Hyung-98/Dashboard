# 개인 자산 관리 대시보드

TypeScript, React, TanStack Query, Recharts, Supabase로 구현한 지출·예산·자산·수입·주식 관리 대시보드입니다.

## 목차

- [기술 스택](#기술-스택)
- [시작하기](#시작하기)
- [환경 변수](#환경-변수)
- [배포 (AWS Amplify)](#배포-aws-amplify)
- [로컬 개발 시 주의사항](#로컬-개발-시-주의사항)
- [Supabase](#supabase)
- [주요 기능](#주요-기능)
- [디렉터리 구조](#디렉터리-구조)
- [라이선스](#라이선스)

## 기술 스택

| 구분      | 기술                       |
| --------- | -------------------------- |
| 빌드      | Vite + React 18            |
| 언어      | TypeScript (strict)        |
| 서버 상태 | TanStack Query v5          |
| 시각화    | Recharts                   |
| 백엔드    | Supabase (Auth + Database) |
| 라우팅    | React Router v6            |
| UI 문서   | Storybook 8                |

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
```

## 환경 변수

| 변수                         | 설명                                                                           |
| ---------------------------- | ------------------------------------------------------------------------------ |
| `VITE_SUPABASE_URL`          | Supabase 프로젝트 URL                                                          |
| `VITE_SUPABASE_ANON_KEY`     | Supabase anon (public) key                                                     |
| `VITE_ALPHA_VANTAGE_API_KEY` | (선택) 미국 주식 시세용. [Alpha Vantage](https://www.alphavantage.co/) 무료 키 |
| `KIS_APP_KEY`                | (선택) 한국투자증권 KIS API 실전투자 앱키. 시세·주문 등 연동 시 사용           |
| `KIS_APP_SECRET`             | (선택) 한국투자증권 KIS API 실전투자 앱시크릿. 백엔드에서만 사용 권장          |
| `MOK_KIS_APP_KEY`            | (선택) 한국투자증권 KIS API 모의투자 앱키                                      |
| `MOK_KIS_APP_SECRET`         | (선택) 한국투자증권 KIS API 모의투자 앱시크릿. 백엔드에서만 사용 권장          |

## 배포 (AWS Amplify)

1. **GitHub 연결** — Amplify Console → New app → Host web app → 이 저장소 연결 후 브랜치(예: `main`) 선택.
2. **빌드** — 루트의 `amplify.yml` 사용. Build: `npm run build`, Output: `dist`.
3. **SPA 라우팅** — 이 프로젝트는 **HashRouter**를 사용합니다. URL이 `/#/stocks`, `/#/expenses` 형태이므로 서버는 항상 `/`만 받고, **Amplify에서 별도 Rewrites and redirects 설정이 필요 없습니다**. 새로고침해도 404가 나지 않습니다.
4. **환경 변수** — Build-time에 `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` 추가.
5. **배포** — Save and deploy. 커스텀 도메인은 Hosting → Domain management에서 설정.

(이전에 BrowserRouter + Amplify SPA 리라이트를 쓰던 경우, 리라이트가 적용되지 않아 하위 경로 새로고침 시 404가 나는 이슈가 있어 HashRouter로 전환했습니다.)

### 배포 후 사용하기 (KR 주식·DB·Auth)

배포된 앱이 **클라우드 Supabase**와 **KR 주식 현재가**를 쓰려면 아래를 모두 해 두어야 합니다.

| 순서 | 할 일                 | 설명                                                                                                                                                                                                                            |
| ---- | --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1    | Edge Function 배포    | `npx supabase functions deploy kis-kr-price` (프로젝트 연결 후 한 번)                                                                                                                                                           |
| 2    | Edge Function Secrets | Supabase Dashboard → **Project settings** → **Edge Functions** → **Secrets**에 `KIS_APP_KEY`, `KIS_APP_SECRET` 등록 (모의투자 시 `MOK_KIS_APP_KEY`, `MOK_KIS_APP_SECRET` 추가)                                                  |
| 3    | 프론트엔드 환경 변수  | Amplify(또는 사용 중인 호스팅) Build 설정에서 **클라우드** Supabase 값 사용: `VITE_SUPABASE_URL=https://<프로젝트_REF>.supabase.co`, `VITE_SUPABASE_ANON_KEY=<클라우드_anon_key>` (Dashboard → Project settings → API에서 확인) |
| 4    | DB 스키마             | 원격 DB에 마이그레이션 적용: `npx supabase link --project-ref <REF>` 후 `npx supabase db push`                                                                                                                                  |

- **로컬에서만** 개발할 때는 `.env.local`에 로컬 URL(`http://127.0.0.1:54321`)을 두고, **배포 빌드**할 때는 호스팅 쪽 환경 변수에 클라우드 URL을 넣으면 됩니다. (`.env.local`은 빌드 서버에 없으므로 Amplify 등에 반드시 설정)
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

5. **주의사항**
   - `.env.local`은 Git에 커밋하지 마세요 (`.gitignore`에 포함되어야 함)
   - 배포 빌드 시에는 `.env.local`이 사용되지 않으므로 호스팅 플랫폼(Amplify 등)에 환경 변수를 별도로 설정해야 합니다
   - 로컬과 클라우드 Supabase는 별개의 데이터베이스이므로 데이터가 공유되지 않습니다
   - 로컬에서 테스트한 후 클라우드에도 동일한 마이그레이션을 적용해야 합니다

### 배포 후 자주 나는 오류

| 증상                                    | 원인                                                  | 조치                                                                                                                                                                                            |
| --------------------------------------- | ----------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **`/stocks/` 등 경로에서 404**          | (HashRouter 사용 시 해당 없음) 서버에 해당 경로 파일이 없으면 404 | 이 프로젝트는 HashRouter 사용으로 해결됨. 다른 호스팅에서 BrowserRouter 쓸 경우 해당 플랫폼의 SPA 리라이트 설정 필요.                                                                          |
| **JS 로드 실패, MIME type "text/html"** | `/<*>` 리라이트가 .js/.css 요청까지 index.html로 보냄 | 기존 `/<*>` 규칙 삭제 또는 정적 파일 제외 규칙으로 교체. (이 프로젝트는 HashRouter라 Amplify 리라이트 불필요.)                                                                                  |
| **`kis-kr-price` 502 (Bad Gateway)**    | Edge Function 미배포 또는 Secrets 미설정              | ① `npx supabase functions deploy kis-kr-price` 실행 ② Supabase Dashboard → **Project settings** → **Edge Functions** → **Secrets**에 `KIS_APP_KEY`, `KIS_APP_SECRET` 등록 후 재배포 없이 반영됨 |

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

| 마이그레이션                            | 내용                                  |
| --------------------------------------- | ------------------------------------- |
| `20250202000000_initial_schema.sql`     | categories, expenses, budgets, assets |
| `20250202100000_incomes.sql`            | incomes 테이블                        |
| `20250203100000_check_email_exists.sql` | 회원가입 이메일 중복 확인 RPC         |
| `20250204100000_stock_holdings.sql`     | stock_holdings (주식 보유)            |

**테이블**: categories(카테고리), expenses(지출), budgets(예산), assets(자산), incomes(수입), stock_holdings(주식).  
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
- **익명 로그인**: Dashboard → Authentication → Providers → **Anonymous** 활성화 시, 세션 없을 때 익명 로그인 시도.

## 주요 기능

| 기능                | 설명                                                                                                                                      |
| ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| **인증**            | 로그인/회원가입, 한글 에러 메시지, 비밀번호 강도·확인·이메일 중복 확인·약관 동의, 익명 로그인                                             |
| **복합 필터 + URL** | `useExpenseFilters` / `useIncomeFilters`로 날짜·카테고리·금액 필터를 URL 쿼리와 동기화                                                    |
| **주식**            | 보유 종목(종목코드·시장 KR/US·수량·평균매수가) 등록, 미국 종목 시세(Alpha Vantage) 연동, 평가금액·손익 표시, 대시보드 요약·자산 파이 반영 |
| **공통 UI**         | Table, Modal, Select, DateRangePicker, Skeleton — Storybook 스토리로 문서화                                                               |
| **에러 처리**       | Error Boundary, API 실패 시 인라인 한글 메시지                                                                                            |
| **스켈레톤**        | 로딩 시 TableSkeleton, CardSkeleton                                                                                                       |
| **데이터 시각화**   | Recharts로 대시보드 월별 지출 추이(LineChart), 카테고리별 비율(PieChart)                                                                  |
| **타입**            | DB/도메인/필터 타입 정의 (`src/types/`), TanStack Query 캐시 (`src/api/`)                                                                 |

## 디렉터리 구조

```
src/
  api/           # queryKeys, expenses, budgets, assets, stocks, stockPrice, categories, incomes, hooks
  components/
    ui/          # Table, Modal, Select, DateRangePicker, Skeleton (+ .stories)
    forms/       # AssetForm, BudgetForm, CategoryForm, ExpenseForm, IncomeForm, StockForm
    AuthInit.tsx
    ErrorBoundary.tsx
    Layout.tsx
  hooks/         # useExpenseFilters, useIncomeFilters
  lib/           # supabase.ts, authErrors.ts
  pages/         # Dashboard, Expenses, Budgets, Assets, Stocks, Categories, Incomes, Login
  types/         # database, domain, filters, api
  App.tsx, main.tsx
```

## 라이선스

MIT
