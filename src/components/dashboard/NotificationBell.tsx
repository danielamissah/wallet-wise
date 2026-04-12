// src/components/dashboard/NotificationBell.tsx
// Shows a bell icon in the sidebar with a badge count when budgets are near/over limit.
// Clicking it opens a dropdown listing the alerts.
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

      // Fetch budgets and transactions in parallel
      const [limitsRes, txRes] = await Promise.all([
        fetch(`/api/budgets?month=${month}&year=${year}`),
        fetch(`/api/transactions?month=${month}&year=${year}&type=expense`),
      ]);

      const limits: any[]       = await limitsRes.json();
      const transactions: any[] = await txRes.json();

      // Sum spending per category
      const spending: Record<string, number> = {};
      transactions.forEach((tx: any) => {
        spending[tx.category] = (spending[tx.category] ?? 0) + Number(tx.amountUsd);
      });

      // Build alerts for categories at 80%+ of limit
      const newAlerts: Alert[] = [];
      for (const limit of limits) {
        const spentUsd = spending[limit.category] ?? 0;
        const capUsd   = Number(limit.limitAmount) / (1); // stored in limit.currency, approximate
        const pct      = Math.min(100, (spentUsd / capUsd) * 100);

        if (pct >= 80) {
          newAlerts.push({
            category: limit.category,
            spent:    spentUsd,
            cap:      Number(limit.limitAmount),
            pct,
            isOver:   spentUsd > capUsd,
            currency: limit.currency,
          });
        }
      }

      setAlerts(newAlerts);
    } catch {
      // Silently fail — notifications are non-critical
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAlerts();
    // Re-check every 5 minutes
    const interval = setInterval(fetchAlerts, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchAlerts]);

  // Close on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="relative p-2 rounded-xl hover:bg-gray-50 text-gray-400 hover:text-gray-600 transition-colors"
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
            className="absolute bottom-10 left-0 w-72 bg-white border border-gray-100 rounded-2xl shadow-xl overflow-hidden z-50"
          >
            {/* Header */}
            <div className="px-4 py-3 border-b border-gray-50 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-800">Notifications</h3>
              {alerts.length > 0 && (
                <span className="text-xs bg-red-50 text-red-500 font-medium px-2 py-0.5 rounded-full">
                  {alerts.length} alert{alerts.length !== 1 ? "s" : ""}
                </span>
              )}
            </div>

            {/* Content */}
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : alerts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 gap-2 px-4 text-center">
                <span className="text-2xl">✅</span>
                <p className="text-sm text-gray-500 font-medium">All budgets on track</p>
                <p className="text-xs text-gray-400">
                  You&apos;ll see alerts here when spending reaches 80% of a budget limit.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50 max-h-64 overflow-y-auto">
                {alerts.map(alert => (
                  <div key={alert.category} className="px-4 py-3">
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <p className="text-sm font-medium text-gray-800">{alert.category}</p>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full shrink-0 ${
                        alert.isOver
                          ? "bg-red-50 text-red-600"
                          : "bg-amber-50 text-amber-600"
                      }`}>
                        {alert.isOver ? "Over limit" : `${alert.pct.toFixed(0)}%`}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400">
                      {alert.isOver
                        ? `Exceeded by ${formatCurrency(alert.spent - alert.cap, alert.currency)}`
                        : `${formatCurrency(alert.spent)} of ${formatCurrency(alert.cap, alert.currency)} limit`
                      }
                    </p>
                    {/* Mini progress bar */}
                    <div className="mt-2 h-1 bg-gray-100 rounded-full overflow-hidden">
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