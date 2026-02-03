# 개인 자산 관리 대시보드

TypeScript, React, TanStack Query, Recharts, Supabase로 구현한 지출·예산·자산·수입 관리 대시보드입니다.

## 목차

- [기술 스택](#기술-스택)
- [시작하기](#시작하기)
- [환경 변수](#환경-변수)
- [배포 (AWS Amplify)](#배포-aws-amplify)
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

| 변수                     | 설명                       |
| ------------------------ | -------------------------- |
| `VITE_SUPABASE_URL`      | Supabase 프로젝트 URL      |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon (public) key |

## 배포 (AWS Amplify)

1. **GitHub 연결** — Amplify Console → New app → Host web app → 이 저장소 연결 후 브랜치(예: `main`) 선택.
2. **빌드** — 루트의 `amplify.yml` 사용. Build: `npm run build`, Output: `dist`.
3. **SPA 리라이트** — Hosting → Rewrites and redirects: Source `/<*>`, Target `/index.html`, Type **200 (Rewrite)**.
4. **환경 변수** — Build-time에 `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` 추가.
5. **배포** — Save and deploy. 커스텀 도메인은 Hosting → Domain management에서 설정.

## Supabase

### 스키마 요약

| 마이그레이션                            | 내용                                  |
| --------------------------------------- | ------------------------------------- |
| `20250202000000_initial_schema.sql`     | categories, expenses, budgets, assets |
| `20250202100000_incomes.sql`            | incomes 테이블                        |
| `20250203100000_check_email_exists.sql` | 회원가입 이메일 중복 확인 RPC         |

**테이블**: categories(카테고리), expenses(지출), budgets(예산), assets(자산), incomes(수입).  
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

| 기능                | 설명                                                                                          |
| ------------------- | --------------------------------------------------------------------------------------------- |
| **인증**            | 로그인/회원가입, 한글 에러 메시지, 비밀번호 강도·확인·이메일 중복 확인·약관 동의, 익명 로그인 |
| **복합 필터 + URL** | `useExpenseFilters` / `useIncomeFilters`로 날짜·카테고리·금액 필터를 URL 쿼리와 동기화        |
| **공통 UI**         | Table, Modal, Select, DateRangePicker, Skeleton — Storybook 스토리로 문서화                   |
| **에러 처리**       | Error Boundary, API 실패 시 인라인 한글 메시지                                                |
| **스켈레톤**        | 로딩 시 TableSkeleton, CardSkeleton                                                           |
| **데이터 시각화**   | Recharts로 대시보드 월별 지출 추이(LineChart), 카테고리별 비율(PieChart)                      |
| **타입**            | DB/도메인/필터 타입 정의 (`src/types/`), TanStack Query 캐시 (`src/api/`)                     |

## 디렉터리 구조

```
src/
  api/           # queryKeys, expenses, budgets, assets, categories, incomes, hooks
  components/
    ui/          # Table, Modal, Select, DateRangePicker, Skeleton (+ .stories)
    forms/       # AssetForm, BudgetForm, CategoryForm, ExpenseForm, IncomeForm
    AuthInit.tsx
    ErrorBoundary.tsx
    Layout.tsx
  hooks/         # useExpenseFilters, useIncomeFilters
  lib/           # supabase.ts, authErrors.ts
  pages/         # Dashboard, Expenses, Budgets, Assets, Categories, Incomes, Login
  types/         # database, domain, filters, api
  App.tsx, main.tsx
```

## 라이선스

MIT
