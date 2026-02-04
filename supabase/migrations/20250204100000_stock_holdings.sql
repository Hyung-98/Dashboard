-- Stock holdings: user's stock investments (symbol, market, quantity, average buy price)
CREATE TABLE stock_holdings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  symbol TEXT NOT NULL,
  market TEXT NOT NULL CHECK (market IN ('KR', 'US')),
  name TEXT,
  quantity NUMERIC NOT NULL CHECK (quantity > 0),
  average_buy_price NUMERIC NOT NULL CHECK (average_buy_price >= 0),
  memo TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE stock_holdings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "stock_holdings_select" ON stock_holdings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "stock_holdings_insert" ON stock_holdings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "stock_holdings_update" ON stock_holdings FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "stock_holdings_delete" ON stock_holdings FOR DELETE USING (auth.uid() = user_id);
