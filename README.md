# 개인 자산 관리 대시보드

복잡한 데이터를 다루는 대시보드 관리자 페이지 예제입니다. TypeScript, TanStack Query, Recharts, Supabase를 사용합니다.

## 기술 스택

- **빌드**: Vite + React 18
- **언어**: TypeScript (strict)
- **서버 상태**: TanStack Query v5
- **시각화**: Recharts
- **백엔드**: Supabase (Auth + Database)
- **라우팅**: React Router v6
- **UI 문서화**: Storybook 8

## 실행 방법

1. 의존성 설치

```bash
npm install
```

2. 환경 변수 설정

`.env.example`을 참고해 `.env` 파일을 만들고 Supabase 프로젝트 URL과 anon key를 넣습니다.

```bash
cp .env.example .env
# .env 편집: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY
```

3. 개발 서버 실행

```bash
npm run dev
```

4. 빌드

```bash
npm run build
```

5. Storybook (공통 컴포넌트 문서)

```bash
npm run storybook
```

## 배포 (AWS Amplify)

1. **GitHub 저장소 연결**  
   AWS Amplify Console → New app → Host web app → GitHub 선택 후 이 저장소 연결.

2. **브랜치 선택**  
   배포할 브랜치(예: `main`) 선택.

3. **빌드 설정**  
   저장소 루트의 `amplify.yml`이 자동 인식됩니다. Build command: `npm run build`, Output directory: `dist`로 설정됨.

4. **SPA 리라이트 설정**  
   Amplify Console → 해당 앱 → **Hosting** → **Rewrites and redirects**에서 규칙 추가:

   - Source: `/<*>`
   - Target: `/index.html`
   - Type: **200 (Rewrite)**

5. **환경 변수**  
   Amplify Console → 해당 앱 → **Environment variables**에서 Build-time 변수로 추가:

   - `VITE_SUPABASE_URL`: Supabase 프로젝트 URL
   - `VITE_SUPABASE_ANON_KEY`: Supabase anon (public) key

6. **배포**  
   Save and deploy 후 배포 URL에서 앱 확인. 커스텀 도메인은 Hosting → Domain management에서 설정할 수 있습니다.

## 환경 변수

| 변수                     | 설명                       |
| ------------------------ | -------------------------- |
| `VITE_SUPABASE_URL`      | Supabase 프로젝트 URL      |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon (public) key |

## Supabase 스키마

`supabase/migrations/20250202000000_initial_schema.sql`에 초기 스키마가 정의되어 있습니다. Supabase 대시보드 SQL Editor 또는 MCP `apply_migration`으로 적용할 수 있습니다.

- **categories**: 카테고리 (expense/asset/income)
- **expenses**: 지출 (category_id, amount, occurred_at, memo)
- **budgets**: 예산 (category_id, amount, period, period_start)
- **assets**: 자산 (category_id, amount, name, updated_at)

RLS가 활성화되어 있으며, `auth.uid()`와 `user_id`로 사용자별 데이터가 격리됩니다.

**로그인 없이 지출/예산/자산 입력을 쓰려면** Supabase 대시보드에서 **Authentication → Providers → Anonymous** 를 켜 주세요. 앱 진입 시 세션이 없으면 익명 로그인을 시도합니다.

## 역량 요약

| 역량                         | 구현                                                                                                    |
| ---------------------------- | ------------------------------------------------------------------------------------------------------- |
| **복합 필터링 + URL**        | `useExpenseFilters` 훅으로 날짜/카테고리/금액대 필터를 URL Query String과 동기화. `/expenses`에서 적용. |
| **공통 컴포넌트 라이브러리** | `src/components/ui/`에 Table, Modal, Select, DateRangePicker, Skeleton. Storybook 스토리로 문서화.      |
| **에러 핸들링**              | Error Boundary로 런타임 오류 시 fallback UI 및 "다시 시도" 버튼. API 실패 시 인라인 에러 메시지.        |
| **스켈레톤 UI**              | 로딩 시 TableSkeleton, CardSkeleton 사용.                                                               |
| **TypeScript**               | DB/도메인/필터 타입 엄격 정의 (`src/types/`).                                                           |
| **TanStack Query**           | queryKeys, useQuery, 필터 기반 캐시 (`src/api/`).                                                       |
| **데이터 시각화**            | Recharts로 대시보드 월별 지출 추이(LineChart), 카테고리별 비율(PieChart).                               |

## 디렉터리 구조

```
src/
  api/           # queryKeys, expenses, budgets, assets, categories, hooks
  components/
    ui/          # Table, Modal, Select, DateRangePicker, Skeleton (+ .stories)
    ErrorBoundary.tsx
    Layout.tsx
  hooks/         # useExpenseFilters
  lib/           # supabase.ts
  pages/         # Dashboard, Expenses, Budgets, Assets
  types/         # database, domain, filters, api
  App.tsx, main.tsx
```

## 라이선스

MIT
