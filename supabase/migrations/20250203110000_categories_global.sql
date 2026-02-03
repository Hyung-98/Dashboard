-- Categories: make global (one row per name+type), remove user_id.
-- 1) Deduplicate: keep one category per (name, type), repoint FKs, then delete duplicates.

-- Map duplicate category ids to the kept id (min id per name, type)
WITH kept AS (
  SELECT DISTINCT ON (name, type) id, name, type
  FROM categories
  ORDER BY name, type, id
),
dupes AS (
  SELECT c.id AS old_id, k.id AS keep_id
  FROM categories c
  JOIN kept k ON k.name = c.name AND k.type = c.type
  WHERE c.id <> k.id
)
UPDATE expenses e
SET category_id = d.keep_id
FROM dupes d
WHERE e.category_id = d.old_id;

WITH kept AS (
  SELECT DISTINCT ON (name, type) id, name, type
  FROM categories
  ORDER BY name, type, id
),
dupes AS (
  SELECT c.id AS old_id, k.id AS keep_id
  FROM categories c
  JOIN kept k ON k.name = c.name AND k.type = c.type
  WHERE c.id <> k.id
)
UPDATE budgets b
SET category_id = d.keep_id
FROM dupes d
WHERE b.category_id = d.old_id;

WITH kept AS (
  SELECT DISTINCT ON (name, type) id, name, type
  FROM categories
  ORDER BY name, type, id
),
dupes AS (
  SELECT c.id AS old_id, k.id AS keep_id
  FROM categories c
  JOIN kept k ON k.name = c.name AND k.type = c.type
  WHERE c.id <> k.id
)
UPDATE assets a
SET category_id = d.keep_id
FROM dupes d
WHERE a.category_id = d.old_id;

WITH kept AS (
  SELECT DISTINCT ON (name, type) id, name, type
  FROM categories
  ORDER BY name, type, id
),
dupes AS (
  SELECT c.id AS old_id, k.id AS keep_id
  FROM categories c
  JOIN kept k ON k.name = c.name AND k.type = c.type
  WHERE c.id <> k.id
)
UPDATE incomes i
SET category_id = d.keep_id
FROM dupes d
WHERE i.category_id = d.old_id;

-- Delete duplicate categories (keep one per name, type)
DELETE FROM categories c
WHERE c.id NOT IN (
  SELECT id FROM (
    SELECT DISTINCT ON (name, type) id FROM categories ORDER BY name, type, id
  ) kept
);

-- 2) Drop RLS policies that use user_id
DROP POLICY IF EXISTS "categories_select" ON categories;
DROP POLICY IF EXISTS "categories_insert" ON categories;
DROP POLICY IF EXISTS "categories_update" ON categories;
DROP POLICY IF EXISTS "categories_delete" ON categories;

-- 3) Remove user_id and add unique constraint
ALTER TABLE categories DROP COLUMN IF EXISTS user_id;
ALTER TABLE categories ADD CONSTRAINT categories_name_type_key UNIQUE (name, type);

-- 4) New RLS: all authenticated users can read; anyone authenticated can insert/update/delete (shared categories)
CREATE POLICY "categories_select" ON categories FOR SELECT TO authenticated USING (true);
CREATE POLICY "categories_insert" ON categories FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "categories_update" ON categories FOR UPDATE TO authenticated USING (true);
CREATE POLICY "categories_delete" ON categories FOR DELETE TO authenticated USING (true);
