CREATE TABLE portfolio_targets (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  symbol     TEXT NOT NULL,
  market     TEXT NOT NULL CHECK (market IN ('KR', 'US')),
  target_pct NUMERIC NOT NULL CHECK (target_pct >= 0 AND target_pct <= 100),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, symbol, market)
);
ALTER TABLE portfolio_targets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own portfolio_targets"
  ON portfolio_targets FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
