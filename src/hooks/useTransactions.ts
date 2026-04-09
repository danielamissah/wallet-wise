// src/hooks/useTransactions.ts
//
// This hook fetches transactions from our API and manages loading/error state.
// useState holds the data. useEffect runs the fetch when the component mounts
// or when month/year/filters change (anything in the dependency array).
//
// The "refetch" function lets components manually trigger a fresh fetch
// after adding or deleting a transaction.

"use client";

import { useState, useEffect, useCallback } from "react";

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

  const fetch_ = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Build query string from filters, skipping any that are undefined
      const params = new URLSearchParams();
      if (filters.month)    params.set("month",    String(filters.month));
      if (filters.year)     params.set("year",     String(filters.year));
      if (filters.search)   params.set("search",   filters.search);
      if (filters.category) params.set("category", filters.category);
      if (filters.type)     params.set("type",     filters.type);

      const res = await fetch(`/api/transactions?${params}`);
      if (!res.ok) throw new Error("Failed to fetch");
      setTransactions(await res.json());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.month, filters.year, filters.search, filters.category, filters.type]);

  useEffect(() => { fetch_(); }, [fetch_]);

  return { transactions, loading, error, refetch: fetch_ };
}