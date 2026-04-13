// src/components/dashboard/NotificationBell.tsx
"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Bell } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { formatCurrency } from "@/lib/utils";

interface Alert {
  category: string;
  spent: number;
  cap: number;
  pct: number;
  isOver: boolean;
  currency: string;
}

export default function NotificationBell() {
  const [alerts,  setAlerts]  = useState<Alert[]>([]);
  const [open,    setOpen]    = useState(false);
  const [loading, setLoading] = useState(true);
  const ref = useRef<HTMLDivElement>(null);

  const fetchAlerts = useCallback(async () => {
    try {
      const now   = new Date();
      const month = now.getMonth() + 1;
      const year  = now.getFullYear();
      const [limitsRes, txRes] = await Promise.all([
        fetch(`/api/budgets?month=${month}&year=${year}`),
        fetch(`/api/transactions?month=${month}&year=${year}&type=expense`),
      ]);
      const limits: any[]       = await limitsRes.json();
      const transactions: any[] = await txRes.json();
      const spending: Record<string, number> = {};
      transactions.forEach((tx: any) => {
        spending[tx.category] = (spending[tx.category] ?? 0) + Number(tx.amountUsd);
      });
      const newAlerts: Alert[] = [];
      for (const limit of limits) {
        const spentUsd = spending[limit.category] ?? 0;
        const capUsd   = Number(limit.limitAmount);
        const pct      = Math.min(100, (spentUsd / capUsd) * 100);
        if (pct >= 80) {
          newAlerts.push({
            category: limit.category, spent: spentUsd, cap: capUsd,
            pct, isOver: spentUsd > capUsd, currency: limit.currency,
          });
        }
      }
      setAlerts(newAlerts);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchAlerts]);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="relative p-2 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
        title="Notifications"
      >
        <Bell className="w-4 h-4" />
        {alerts.length > 0 && (
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute bottom-10 left-0 w-72 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl shadow-xl overflow-hidden z-50"
          >
            <div className="px-4 py-3 border-b border-gray-50 dark:border-gray-800 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-800 dark:text-white">Notifications</h3>
              {alerts.length > 0 && (
                <span className="text-xs bg-red-50 dark:bg-red-900/40 text-red-500 dark:text-red-400 font-medium px-2 py-0.5 rounded-full">
                  {alerts.length} alert{alerts.length !== 1 ? "s" : ""}
                </span>
              )}
            </div>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : alerts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 gap-2 px-4 text-center">
                <span className="text-2xl">✅</span>
                <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">All budgets on track</p>
                <p className="text-xs text-gray-400 dark:text-gray-500">
                  You&apos;ll see alerts here when spending reaches 80% of a limit.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50 dark:divide-gray-800 max-h-64 overflow-y-auto">
                {alerts.map(alert => (
                  <div key={alert.category} className="px-4 py-3">
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <p className="text-sm font-medium text-gray-800 dark:text-white">{alert.category}</p>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full shrink-0 ${
                        alert.isOver
                          ? "bg-red-50 dark:bg-red-900/40 text-red-600 dark:text-red-400"
                          : "bg-amber-50 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400"
                      }`}>
                        {alert.isOver ? "Over limit" : `${alert.pct.toFixed(0)}%`}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 dark:text-gray-500">
                      {alert.isOver
                        ? `Exceeded by ${formatCurrency(alert.spent - alert.cap, alert.currency)}`
                        : `${formatCurrency(alert.spent)} of ${formatCurrency(alert.cap, alert.currency)} limit`
                      }
                    </p>
                    <div className="mt-2 h-1 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${alert.isOver ? "bg-red-500" : "bg-amber-400"}`}
                        style={{ width: `${Math.min(100, alert.pct)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}