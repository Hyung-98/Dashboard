-- Stock buy/sell transaction history (optional; holdings remain source of truth for current position)
CREATE TABLE stock_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  symbol TEXT NOT NULL,
  market TEXT NOT NULL CHECK (market IN ('KR', 'US')),
  side TEXT NOT NULL CHECK (side IN ('buy', 'sell')),
  quantity NUMERIC NOT NULL CHECK (quantity > 0),
  price NUMERIC NOT NULL CHECK (price >= 0),
  occurred_at DATE NOT NULL,
  memo TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE stock_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "stock_transactions_select" ON stock_transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "stock_transactions_insert" ON stock_transactions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "stock_transactions_delete" ON stock_transactions FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX idx_stock_transactions_user_occurred ON stock_transactions (user_id, occurred_at DESC);
