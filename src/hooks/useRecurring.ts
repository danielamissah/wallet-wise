// src/hooks/useRecurring.ts
"use client";

import { useState, useEffect, useCallback } from "react";

export interface RecurringTransaction {
  id: string;
  name: string;
  amount: string;
  type: "income" | "expense";
  category: string;
  currency: string;
  frequency: "monthly" | "weekly" | "biweekly";
  dayOfPeriod: number;
  active: boolean;
  nextDue?: string;
  notes?: string;
}

export function useRecurring() {
  const [items,   setItems]   = useState<RecurringTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res  = await fetch("/api/recurring");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setItems(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error("useRecurring error:", e);
      setError(String(e));
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refetch(); }, [refetch]);

  return { items, loading, error, refetch };
}