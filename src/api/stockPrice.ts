/**
 * Stock price service: current price by symbol + market.
 * All markets (KR, US) use KIS API via Supabase Edge Function kis-kr-price.
 * US stocks are fetched in USD and converted to KRW using KIS exchange rates.
 */

export type StockMarket = "KR" | "US";

/** Key for caching: market:symbol */
export function priceKey(market: StockMarket, symbol: string): string {
  return `${market}:${symbol}`;
}

/**
 * Fetch current prices for multiple holdings. Returns a map of priceKey -> price (null if unavailable).
 * All stocks (KR and US) are fetched via KIS API in a single batch request.
 * US prices are returned in KRW (converted from USD using KIS exchange rates).
 */
export async function getCurrentPrices(
  items: { symbol: string; market: StockMarket; exchange?: string }[]
): Promise<Record<string, number | null>> {
  const result: Record<string, number | null> = {};

  if (items.length === 0) {
    return result;
  }

  const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/kis-kr-price`;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({
        items: items.map((i) => ({
          symbol: i.symbol.trim(),
          market: i.market,
          exchange: i.exchange,
        })),
      }),
    });

    let data: { prices?: Record<string, number | null>; errors?: Record<string, string>; error?: string } | undefined;

    try {
      data = (await res.json()) as typeof data;
    } catch {
      console.error("[kis-kr-price] invalid JSON response");
      items.forEach((i) => (result[priceKey(i.market, i.symbol)] = null));
      return result;
    }

    if (!res.ok) {
      const msg = data?.error ?? `HTTP ${res.status}`;
      console.error("[kis-kr-price]", msg);
      items.forEach((i) => (result[priceKey(i.market, i.symbol)] = null));
      return result;
    }

    const prices = data?.prices ?? {};
    if (data?.errors && Object.keys(data.errors).length > 0) {
      console.error("[kis-kr-price] errors:", data.errors);
    }

    // Map prices from Edge Function response (which uses "market:symbol" keys) to our result
    for (const item of items) {
      const key = priceKey(item.market, item.symbol);
      const p = prices[key];
      result[key] = typeof p === "number" && Number.isFinite(p) && p >= 0 ? p : null;
    }
  } catch (e) {
    console.error("[kis-kr-price]", e);
    items.forEach((i) => (result[priceKey(i.market, i.symbol)] = null));
  }

  return result;
}
