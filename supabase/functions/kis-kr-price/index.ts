/// <reference path="../deno.d.ts" />
/** Ambient Deno types for IDE; runtime provides real global in Supabase Edge Functions. */
declare const Deno: {
  serve: (handler: (req: Request) => Promise<Response> | Response) => void;
  env: { get: (key: string) => string | undefined };
};

import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

const KIS_REAL_BASE = "https://openapi.koreainvestment.com:9443";
const KIS_DEMO_BASE = "https://openapivts.koreainvestment.com:29443";
const TR_ID_REAL = "FHKST01010100";
const TR_ID_DEMO = "VHKST01010100";

/** KIS expects 6-digit 종목코드; pad with leading zeros. */
function toSixDigitSymbol(s: string): string {
  const t = s.replace(/\D/g, "");
  if (t.length >= 6) return t.slice(0, 6);
  return t.padStart(6, "0");
}

/** In-memory token cache by env (real/demo), reused within same isolate. */
const tokenCache: { real?: { token: string; expiresAt: number }; demo?: { token: string; expiresAt: number } } = {};
/** Serialize token fetch: only one in-flight request per real/demo so we don't hit KIS "1 token per minute" limit. */
let tokenFetchPromise: { real?: Promise<string>; demo?: Promise<string> } = {};
const EXPIRY_BUFFER_MS = 60 * 1000;
const DB_POLL_MS = 2000;
const DB_POLL_ATTEMPTS = 5;

interface ReqBody {
  symbol?: string;
  /** Batch: multiple symbols in one request; one token, then one price call per symbol. */
  symbols?: string[];
  demo?: boolean;
}

interface TokenResponse {
  access_token?: string;
  access_token_token_expired?: string;
}

interface KISPriceOutput {
  stck_prpr?: string;
  rt_cd?: string;
  msg_cd?: string;
  msg1?: string;
}

interface KISPriceResponse {
  rt_cd?: string;
  output?: KISPriceOutput;
}

/** kis_token_cache row (table not in generated client types). */
interface KisTokenCacheRow {
  token: string;
  expires_at: string;
}

function jsonResponse(data: unknown, status: number, headers: Record<string, string> = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json", ...headers },
  });
}

function getSupabase() {
  const url = Deno.env.get("SUPABASE_URL");
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !key) throw new Error("SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not set");
  return createClient(url, key);
}

/** Fetch new token from KIS and return { token, expiresAt }. */
async function fetchTokenFromKIS(
  base: string,
  appKey: string,
  appSecret: string
): Promise<{ token: string; expiresAt: number }> {
  const tokenRes = await fetch(`${base}/oauth2/tokenP`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      grant_type: "client_credentials",
      appkey: appKey,
      appsecret: appSecret,
    }),
  });
  if (!tokenRes.ok) {
    const text = await tokenRes.text();
    throw new Error(`KIS token failed: ${tokenRes.status} ${text}`);
  }
  const tokenData = (await tokenRes.json()) as TokenResponse;
  const tok = tokenData.access_token;
  if (!tok) throw new Error("KIS token response missing access_token");
  const expiredStr = tokenData.access_token_token_expired;
  const expiresAt = expiredStr
    ? new Date(expiredStr.replace(" ", "T")).getTime() - EXPIRY_BUFFER_MS
    : Date.now() + 23 * 60 * 60 * 1000;
  return { token: tok, expiresAt };
}

/** Get access token: in-memory cache, then DB cache (shared across isolates), then KIS with soft lock. */
async function getAccessToken(base: string, appKey: string, appSecret: string, demo: boolean): Promise<string> {
  const now = Date.now();
  const cacheKey = demo ? "demo" : "real";
  const entry = tokenCache[cacheKey];
  if (entry && entry.expiresAt > now + EXPIRY_BUFFER_MS) {
    return entry.token;
  }

  let tokenPromise = tokenFetchPromise[cacheKey];
  if (!tokenPromise) {
    tokenPromise = (async (): Promise<string> => {
      try {
        const validAt = now + EXPIRY_BUFFER_MS;
        let supabase: unknown = null;
        try {
          supabase = getSupabase();
        } catch {
          // No DB env: fall back to KIS only (in-memory + serialized)
        }

        if (supabase) {
          type DbFrom = {
            select: (cols: string) => {
              eq: (col: string, val: string) => { single: () => Promise<{ data: KisTokenCacheRow | null }> };
            };
            upsert: (row: Record<string, unknown>, opts: { onConflict: string }) => Promise<unknown>;
          };
          const db = supabase as {
            from: (table: string) => DbFrom;
            rpc: (name: string, params: Record<string, string>) => Promise<{ data: boolean | null }>;
          };
          const { data } = await db.from("kis_token_cache").select("token, expires_at").eq("env", cacheKey).single();
          const row = data;
          if (row?.token && row.expires_at) {
            const expiresAtMs = new Date(row.expires_at).getTime();
            if (expiresAtMs > validAt) {
              tokenCache[cacheKey] = { token: row.token, expiresAt: expiresAtMs };
              return row.token;
            }
          }

          const { data: didClaim } = await db.rpc("kis_try_claim_token_refresh", { p_env: cacheKey });
          if (didClaim === true) {
            const { token, expiresAt } = await fetchTokenFromKIS(base, appKey, appSecret);
            const expiresAtIso = new Date(expiresAt).toISOString();
            await db
              .from("kis_token_cache")
              .upsert(
                { env: cacheKey, token, expires_at: expiresAtIso, refresh_started_at: null },
                { onConflict: "env" }
              );
            tokenCache[cacheKey] = { token, expiresAt };
            return token;
          }

          for (let i = 0; i < DB_POLL_ATTEMPTS; i++) {
            await new Promise((r) => setTimeout(r, DB_POLL_MS));
            const { data: data2 } = await db
              .from("kis_token_cache")
              .select("token, expires_at")
              .eq("env", cacheKey)
              .single();
            const row2 = data2;
            if (row2?.token && row2.expires_at) {
              const expiresAtMs = new Date(row2.expires_at).getTime();
              if (expiresAtMs > validAt) {
                tokenCache[cacheKey] = { token: row2.token, expiresAt: expiresAtMs };
                return row2.token;
              }
            }
          }
        }

        const { token, expiresAt } = await fetchTokenFromKIS(base, appKey, appSecret);
        tokenCache[cacheKey] = { token, expiresAt };
        return token;
      } finally {
        delete tokenFetchPromise[cacheKey];
      }
    })();
    tokenFetchPromise[cacheKey] = tokenPromise;
  }
  return tokenPromise;
}

/** Fetch one symbol price; returns null on error. */
async function fetchOnePrice(
  base: string,
  trId: string,
  appKey: string,
  appSecret: string,
  accessToken: string,
  sixDigitSymbol: string
): Promise<number | null> {
  const priceUrl = new URL(`${base}/uapi/domestic-stock/v1/quotations/inquire-price`);
  priceUrl.searchParams.set("FID_COND_MRKT_DIV_CODE", "J");
  priceUrl.searchParams.set("FID_INPUT_ISCD", sixDigitSymbol);

  const priceRes = await fetch(priceUrl.toString(), {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      appkey: appKey,
      appsecret: appSecret,
      tr_id: trId,
      custtype: "P",
      "Content-Type": "application/json",
    },
  });

  if (!priceRes.ok) return null;

  const priceData = (await priceRes.json()) as KISPriceResponse;
  if (priceData.rt_cd !== "0") return null;

  const priceStr = priceData.output?.stck_prpr;
  if (priceStr == null || priceStr === "") return null;

  const price = Number(priceStr);
  if (!Number.isFinite(price) || price < 0) return null;
  return price;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  try {
    let body: ReqBody = {};
    try {
      body = (await req.json()) as ReqBody;
    } catch {
      return jsonResponse({ error: "Invalid JSON body" }, 400);
    }

    const demo = Boolean(body.demo);
    const rawSymbol = typeof body.symbol === "string" ? body.symbol.trim() : "";
    const symbol = toSixDigitSymbol(rawSymbol);
    const symbolsRaw = Array.isArray(body.symbols)
      ? (body.symbols as string[]).map((s) => (typeof s === "string" ? s.trim() : "")).filter(Boolean)
      : [];
    const symbols = symbolsRaw.map(toSixDigitSymbol);
    const isBatch = symbols.length > 0;

    if (!isBatch && !rawSymbol) {
      return jsonResponse({ error: "symbol or symbols is required" }, 400);
    }

    const appKey = demo ? Deno.env.get("MOK_KIS_APP_KEY") : Deno.env.get("KIS_APP_KEY");
    const appSecret = demo ? Deno.env.get("MOK_KIS_APP_SECRET") : Deno.env.get("KIS_APP_SECRET");

    if (!appKey || !appSecret) {
      return jsonResponse(
        { error: demo ? "MOK_KIS_APP_KEY / MOK_KIS_APP_SECRET not set" : "KIS_APP_KEY / KIS_APP_SECRET not set" },
        500
      );
    }

    const base = demo ? KIS_DEMO_BASE : KIS_REAL_BASE;
    const trId = demo ? TR_ID_DEMO : TR_ID_REAL;

    try {
      const accessToken = await getAccessToken(base, appKey, appSecret, demo);

      if (isBatch) {
        const prices: Record<string, number | null> = {};
        for (const sym of symbols) {
          prices[sym] = await fetchOnePrice(base, trId, appKey, appSecret, accessToken, sym);
        }
        return jsonResponse({ prices }, 200);
      }

      const price = await fetchOnePrice(base, trId, appKey, appSecret, accessToken, symbol);
      if (price === null) {
        return jsonResponse({ error: "KIS price unavailable or invalid" }, 502);
      }
      return jsonResponse({ price }, 200);
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      return jsonResponse({ error: message }, 502);
    }
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return jsonResponse({ error: `kis-kr-price: ${message}` }, 502);
  }
});
