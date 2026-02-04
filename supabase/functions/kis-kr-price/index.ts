/** Ambient Deno types for IDE; runtime provides real global in Supabase Edge Functions. */
declare const Deno: {
  serve: (handler: (req: Request) => Promise<Response> | Response) => void;
  env: { get: (key: string) => string | undefined };
};

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

interface ReqBody {
  symbol?: string;
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

function jsonResponse(data: unknown, status: number, headers: Record<string, string> = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json", ...headers },
  });
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

    const rawSymbol = typeof body.symbol === "string" ? body.symbol.trim() : "";
    const symbol = toSixDigitSymbol(rawSymbol);
    const demo = Boolean(body.demo);

    if (!rawSymbol) {
      return jsonResponse({ error: "symbol is required" }, 400);
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
      const now = Date.now();
      const cacheKey = demo ? "demo" : "real";
      const entry = tokenCache[cacheKey];
      let accessToken: string | undefined;
      if (entry && entry.expiresAt > now + EXPIRY_BUFFER_MS) {
        accessToken = entry.token;
      }
      if (!accessToken) {
        let tokenPromise = tokenFetchPromise[cacheKey];
        if (!tokenPromise) {
          tokenPromise = (async (): Promise<string> => {
            try {
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
              tokenCache[cacheKey] = { token: tok, expiresAt };
              return tok;
            } finally {
              delete tokenFetchPromise[cacheKey];
            }
          })();
          tokenFetchPromise[cacheKey] = tokenPromise;
        }
        accessToken = await tokenPromise;
      }

      const priceUrl = new URL(`${base}/uapi/domestic-stock/v1/quotations/inquire-price`);
      priceUrl.searchParams.set("FID_COND_MRKT_DIV_CODE", "J");
      priceUrl.searchParams.set("FID_INPUT_ISCD", symbol);

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

      if (!priceRes.ok) {
        const text = await priceRes.text();
        return jsonResponse({ error: `KIS price failed: ${priceRes.status} ${text}` }, 502);
      }

      const priceData = (await priceRes.json()) as KISPriceResponse;
      if (priceData.rt_cd !== "0") {
        const msg = priceData.output?.msg1 ?? priceData.rt_cd ?? "Unknown KIS error";
        return jsonResponse({ error: msg }, 502);
      }

      const priceStr = priceData.output?.stck_prpr;
      if (priceStr == null || priceStr === "") {
        return jsonResponse({ error: "KIS response missing stck_prpr" }, 502);
      }

      const price = Number(priceStr);
      if (!Number.isFinite(price) || price < 0) {
        return jsonResponse({ error: "Invalid price from KIS" }, 502);
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
