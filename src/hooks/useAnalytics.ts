// src/hooks/useAnalytics.ts
// Fetches the analytics data that powers all charts on the overview page.

"use client";

import { useState, useEffect } from "react";

export interface AnalyticsData {
  monthlyTotals: { month: string; income: number; expense: number }[];
  categoryBreakdown: { category: string; total: number }[];
  dailySpending: { day: number; amount: number }[];
  topExpenses: {
    id: string;
    name: string;
    amount: number;
    amountUsd: number;
    currency: string;
    category: string;
  }[];
}

export function useAnalytics(month: number, year: number) {
  const [data, setData]       = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/analytics?month=${month}&year=${year}`)
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [month, year]);

  return { data, loading };
}