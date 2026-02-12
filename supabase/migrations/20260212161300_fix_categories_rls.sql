-- Fix: categories 테이블의 INSERT/UPDATE/DELETE 정책을 비익명 인증 사용자만 허용
-- 익명 사용자는 카테고리 조회(SELECT)만 가능

-- 기존 CUD 정책 삭제
DROP POLICY IF EXISTS "categories_insert" ON categories;
DROP POLICY IF EXISTS "categories_update" ON categories;
DROP POLICY IF EXISTS "categories_delete" ON categories;

-- 비익명 인증 사용자만 CUD 허용
CREATE POLICY "categories_insert" ON categories
  FOR INSERT TO authenticated
  WITH CHECK ((auth.jwt()->>'is_anonymous')::boolean IS NOT TRUE);

CREATE POLICY "categories_update" ON categories
  FOR UPDATE TO authenticated
  USING ((auth.jwt()->>'is_anonymous')::boolean IS NOT TRUE);

CREATE POLICY "categories_delete" ON categories
  FOR DELETE TO authenticated
  USING ((auth.jwt()->>'is_anonymous')::boolean IS NOT TRUE);
