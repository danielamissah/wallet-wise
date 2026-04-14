// src/hooks/useLoans.ts
"use client";

import { useState, useEffect, useCallback } from "react";

export interface LoanPayment {
  id: string;
  loanId: string;
  amount: string;
  principalPaid: string;
  interestPaid: string;
  date: string;
  notes?: string;
}

export interface Loan {
  id: string;
  name: string;
  lender?: string;
  totalAmount: string;
  remainingBalance: string;
  interestRate: string;
  monthlyPayment: string;
  currency: string;
  startDate: string;
  nextPaymentDate?: string;
  paidOff: boolean;
  notes?: string;
  payments: LoanPayment[];
}

export function useLoans() {
  const [loans,   setLoans]   = useState<Loan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res  = await fetch("/api/loans");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setLoans(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error("useLoans error:", e);
      setError(String(e));
      setLoans([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refetch(); }, [refetch]);

  return { loans, loading, error, refetch };
}