-- Incomes table (mirrors expenses structure for income entries)
CREATE TABLE incomes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL CHECK (amount >= 0),
  occurred_at DATE NOT NULL,
  memo TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE
);

ALTER TABLE incomes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "incomes_select" ON incomes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "incomes_insert" ON incomes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "incomes_update" ON incomes FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "incomes_delete" ON incomes FOR DELETE USING (auth.uid() = user_id);
