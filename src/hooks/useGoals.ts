// src/hooks/useGoals.ts

"use client";

import { useState, useEffect, useCallback } from "react";

export interface Goal {
  id: string;
  name: string;
  targetAmount: string;
  savedAmount: string;
  currency: string;
  color: string;
  completed: boolean;
}

export function useGoals() {
  const [goals, setGoals]     = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/goals");
      setGoals(await res.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refetch(); }, [refetch]);

  return { goals, loading, refetch };
}