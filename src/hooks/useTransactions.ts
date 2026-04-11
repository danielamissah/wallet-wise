// src/hooks/useTransactions.ts
"use client";

import { useState, useEffect, useCallback, useRef } from "react";

export interface Transaction {
  id: string;
  name: string;
  amount: string;
  type: "income" | "expense";
  category: string;
  currency: string;
  amountUsd: string;
  date: string;
  note?: string;
}

interface Filters {
  month?: number;
  year?: number;
  search?: string;
  category?: string;
  type?: string;
}

export function useTransactions(filters: Filters = {}) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState<string | null>(null);

  // Use a ref to always have the latest filters without re-creating fetch_
  const filtersRef = useRef(filters);
  filtersRef.current = filters;

  // Counter trick: incrementing this triggers a re-fetch without changing fetch_'s identity
  const [tick, setTick] = useState(0);
  const refetch = useCallback(() => setTick(t => t + 1), []);

  useEffect(() => {
    let cancelled = false; // prevents setting state on unmounted component
    setLoading(true);
    setError(null);

    const f = filtersRef.current;
    const params = new URLSearchParams();
    if (f.month)    params.set("month",    String(f.month));
    if (f.year)     params.set("year",     String(f.year));
    if (f.search)   params.set("search",   f.search);
    if (f.category) params.set("category", f.category);
    if (f.type)     params.set("type",     f.type);

    fetch(`/api/transactions?${params}`)
      .then(r => r.ok ? r.json() : Promise.reject("Failed"))
      .then(data => { if (!cancelled) { setTransactions(data); setLoading(false); } })
      .catch(e  => { if (!cancelled) { setError(String(e)); setLoading(false); } });

    return () => { cancelled = true; };
  // Re-run when month/year/filters change OR when refetch() is called (tick changes)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tick, filters.month, filters.year, filters.search, filters.category, filters.type]);

  return { transactions, loading, error, refetch };
}