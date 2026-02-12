-- Add exchange column for US stocks
-- KIS API supports three US exchanges: Nasdaq (NAS), NYSE (NYS), AMEX (AMS)
ALTER TABLE stock_holdings
ADD COLUMN exchange TEXT CHECK (exchange IN ('NAS', 'NYS', 'AMS', NULL));

COMMENT ON COLUMN stock_holdings.exchange IS 'US stock exchange code for KIS API: NAS (Nasdaq), NYS (NYSE), AMS (AMEX). NULL for KR stocks.';

-- Default to NAS (Nasdaq) for existing US stocks
UPDATE stock_holdings
SET exchange = 'NAS'
WHERE market = 'US' AND exchange IS NULL;
