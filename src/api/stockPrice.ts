/**
 * Stock price service: current price by symbol + market.
 * US: Alpha Vantage (GLOBAL_QUOTE). KR: Supabase Edge Function kis-kr-price (KIS API).
 */

const ALPHA_VANTAGE_BASE = "https://www.alphavantage.co/query";

export type StockMarket = "KR" | "US";

export async function getCurrentPrice(symbol: string, market: StockMarket): Promise<number | null> {
  if (market === "KR") {
    try {
      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/kis-kr-price`;
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({ symbol: symbol.trim() }),
      });
      let data: { price?: number; error?: string };
      try {
        data = (await res.json()) as { price?: number; error?: string };
      } catch {
        if (import.meta.env.DEV) console.error("kis-kr-price: invalid JSON response");
        return null;
      }
      if (!res.ok) {
        if (import.meta.env.DEV) console.error("kis-kr-price:", data?.error ?? res.status);
        return null;
      }
      const price = data?.price;
      if (typeof price !== "number" || !Number.isFinite(price) || price < 0) return null;
      return price;
    } catch (e) {
      if (import.meta.env.DEV) console.error("kis-kr-price:", e);
      return null;
    }
  }
  const apiKey = import.meta.env.VITE_ALPHA_VANTAGE_API_KEY as string | undefined;
  if (!apiKey?.trim()) {
    return null;
  }
  const params = new URLSearchParams({
    function: "GLOBAL_QUOTE",
    symbol: symbol.trim(),
    apikey: apiKey,
  });
  const url = `${ALPHA_VANTAGE_BASE}?${params.toString()}`;
  try {
    const res = await fetch(url);
    const data = (await res.json()) as {
      "Global Quote"?: { "05. price"?: string };
    };
    const quote = data["Global Quote"];
    const priceStr = quote?.["05. price"];
    if (priceStr == null || priceStr === "") return null;
    const price = Number(priceStr);
    return Number.isFinite(price) && price >= 0 ? price : null;
  } catch {
    return null;
  }
}

/** Key for caching: market:symbol */
export function priceKey(market: StockMarket, symbol: string): string {
  return `${market}:${symbol}`;
}

/**
 * Fetch current prices for multiple holdings. Returns a map of priceKey -> price (null if unavailable).
 * Calls getCurrentPrice per symbol; use with React Query staleTime to limit API usage.
 */
export async function getCurrentPrices(
  items: { symbol: string; market: StockMarket }[]
): Promise<Record<string, number | null>> {
  const result: Record<string, number | null> = {};
  for (const { symbol, market } of items) {
    const key = priceKey(market, symbol);
    result[key] = await getCurrentPrice(symbol, market);
  }
  return result;
}
