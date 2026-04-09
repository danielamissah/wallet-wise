// src/app/api/exchange-rates/route.ts
//
// GET /api/exchange-rates
//
// Proxies the free exchange rate API through our backend.
// Why proxy it? Two reasons:
// 1. We can cache the result for 1 hour so we don't hammer the external API
// 2. The client never needs to know which exchange rate service we use

import { NextResponse } from "next/server";

let cache: { rates: Record<string, number>; fetchedAt: number } | null = null;
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

export async function GET() {
  // Return cached rates if they're still fresh
  if (cache && Date.now() - cache.fetchedAt < CACHE_TTL_MS) {
    return NextResponse.json(cache.rates);
  }

  try {
    const res  = await fetch("https://open.er-api.com/v6/latest/USD");
    const data = await res.json();
    cache = { rates: data.rates, fetchedAt: Date.now() };
    return NextResponse.json(data.rates);
  } catch {
    // If the fetch fails, return a 1:1 fallback so the app doesn't break
    return NextResponse.json({ USD: 1 });
  }
}