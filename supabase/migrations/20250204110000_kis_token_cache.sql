-- KIS API token cache: shared across Edge Function isolates to avoid 1 token/minute rate limit.
-- Only backend (Edge with service_role) should access; RLS denies anon/auth by default for new tables.
CREATE TABLE kis_token_cache (
  env TEXT PRIMARY KEY,
  token TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  refresh_started_at TIMESTAMPTZ
);

COMMENT ON TABLE kis_token_cache IS 'KIS OAuth token cache; read/write from kis-kr-price Edge Function (service_role) only';

ALTER TABLE kis_token_cache ENABLE ROW LEVEL SECURITY;

-- No policy for anon/authenticated: only service_role (bypasses RLS) can read/write.

-- Atomic "claim" of refresh: only one caller gets true so only one requests a new token from KIS.
-- Inserts a placeholder row if none exists so the first request can claim.
CREATE OR REPLACE FUNCTION kis_try_claim_token_refresh(p_env TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  updated INTEGER;
BEGIN
  INSERT INTO kis_token_cache (env, token, expires_at, refresh_started_at)
  VALUES (p_env, '', now(), now())
  ON CONFLICT (env) DO UPDATE
  SET refresh_started_at = now()
  WHERE kis_token_cache.refresh_started_at IS NULL
     OR kis_token_cache.refresh_started_at < now() - interval '2 minutes';
  GET DIAGNOSTICS updated = ROW_COUNT;
  RETURN updated > 0;
END;
$$;
