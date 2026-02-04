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
        console.error("kis-kr-price: invalid JSON response (502 may mean function not deployed or crashed)");
        return null;
      }
      if (!res.ok) {
        const msg = data?.error ?? `HTTP ${res.status}`;
        console.error("kis-kr-price:", msg);
        return null;
      }
      const price = data?.price;
      if (typeof price !== "number" || !Number.isFinite(price) || price < 0) return null;
      return price;
    } catch (e) {
      console.error("kis-kr-price:", e);
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
 * KR: single POST with symbols (batch) to avoid one token per symbol. US: one Alpha Vantage call per symbol.
 */
export async function getCurrentPrices(
  items: { symbol: string; market: StockMarket }[]
): Promise<Record<string, number | null>> {
  const result: Record<string, number | null> = {};
  const krItems = items.filter((i) => i.market === "KR");
  const usItems = items.filter((i) => i.market === "US");

  if (krItems.length > 0) {
    const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/kis-kr-price`;
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({ symbols: krItems.map((i) => i.symbol.trim()) }),
      });
      let data: { prices?: Record<string, number | null>; error?: string } | undefined;
      try {
        data = (await res.json()) as { prices?: Record<string, number | null>; error?: string };
      } catch {
        console.error("kis-kr-price: invalid JSON response");
        krItems.forEach((i) => (result[priceKey(i.market, i.symbol)] = null));
      }
      if (data !== undefined) {
        if (!res.ok) {
          const msg = data.error ?? `HTTP ${res.status}`;
          console.error("kis-kr-price:", msg);
          krItems.forEach((i) => (result[priceKey(i.market, i.symbol)] = null));
        } else {
          const prices = data.prices ?? {};
          const normalized = (s: string) => s.replace(/\D/g, "").padStart(6, "0").slice(0, 6);
          for (const { symbol, market } of krItems) {
            const key = priceKey(market, symbol);
            const six = normalized(symbol);
            const p = prices[six];
            result[key] = typeof p === "number" && Number.isFinite(p) && p >= 0 ? p : null;
          }
        }
      }
    } catch (e) {
      console.error("kis-kr-price:", e);
      krItems.forEach((i) => (result[priceKey(i.market, i.symbol)] = null));
    }
  }

  for (const { symbol, market } of usItems) {
    result[priceKey(market, symbol)] = await getCurrentPrice(symbol, market);
  }

  return result;
}
