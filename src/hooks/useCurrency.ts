// src/hooks/useCurrency.ts
//
// Fetches exchange rates once and caches them in module-level state.
// Module-level variables persist for the lifetime of the browser tab,
// so we only hit the API once no matter how many components use this hook.

"use client";

import { useState, useEffect } from "react";

// Module-level cache — shared across all components that use this hook
let cachedRates: Record<string, number> | null = null;

export function useCurrency() {
  const [rates, setRates]     = useState<Record<string, number>>(cachedRates ?? { USD: 1 });
  const [loading, setLoading] = useState(!cachedRates);

  useEffect(() => {
    if (cachedRates) return; // already fetched
    fetch("/api/exchange-rates")
      .then(r => r.json())
      .then(data => {
        cachedRates = data;
        setRates(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return { rates, loading };
}