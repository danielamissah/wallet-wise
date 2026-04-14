// src/hooks/useRules.ts
"use client";

import { useState, useEffect, useCallback } from "react";

export interface BudgetRule {
  id: string;
  name: string;
  category: string;
  ruleType: "percentage" | "fixed";
  ruleBase: "gross_income" | "net_income" | "custom";
  value: string;
  currency: string;
  priority: number;
  active: boolean;
  description?: string;
}

export interface RuleCalculation {
  grossIncome: number;
  netIncome: number;
  totalAllocated: number;
  freeCash: number;
  freeCashPct: number;
  breakdown: {
    ruleId: string;
    name: string;
    category: string;
    ruleType: string;
    value: number;
    allocated: number;
    percentage: number;
  }[];
}

export function useRules() {
  const [rules,   setRules]   = useState<BudgetRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res  = await fetch("/api/rules");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setRules(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error("useRules error:", e);
      setError(String(e));
      setRules([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refetch(); }, [refetch]);

  async function calculate(
    grossIncome: number,
    netIncome?: number
  ): Promise<RuleCalculation | null> {
    try {
      const res = await fetch("/api/rules/calculate", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ grossIncome, netIncome }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (e) {
      console.error("calculate error:", e);
      return null;
    }
  }

  return { rules, loading, error, refetch, calculate };
}