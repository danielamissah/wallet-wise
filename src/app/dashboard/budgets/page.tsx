// src/app/dashboard/budgets/page.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { useTransactions } from "@/hooks/useTransactions";
import { useCurrency } from "@/hooks/useCurrency";
import { CATEGORIES, getCategoryColor, getCategoryIcon } from "@/lib/categories";
import { formatCurrency, MONTHS, cn, getPreferredCurrency } from "@/lib/utils";
import { SUPPORTED_CURRENCIES } from "@/lib/currencies";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import PageTransition from "@/components/ui/PageTransition";
import { ChevronLeft, ChevronRight, Plus, AlertTriangle, Pencil, Trash2 } from "lucide-react";

interface BudgetLimit {
  id: string;
  category: string;
  limitAmount: string;
  currency: string;
  month: number;
  year: number;
}

export default function BudgetsPage() {
  const now = new Date();
  const [month,      setMonth]      = useState(now.getMonth() + 1);
  const [year,       setYear]       = useState(now.getFullYear());
  const [limits,     setLimits]     = useState<BudgetLimit[]>([]);
  const [showModal,  setShowModal]  = useState(false);
  const [editCat, setEditCat] = useState<string>(CATEGORIES.filter(c => c.name !== "Income")[0].name);
  const [limitInput, setLimitInput] = useState("");
  const [currency,   setCurrency]   = useState("USD");
  const [saving,     setSaving]     = useState(false);
  const [deleting,   setDeleting]   = useState<string | null>(null);

  // Preferred display currency
  const [displayCurrency, setDisplayCurrency] = useState("USD");
  const { rates } = useCurrency();

  useEffect(() => {
    const preferred = getPreferredCurrency();
    setDisplayCurrency(preferred);
  }, []);

  // Convert any USD amount to the display currency
  function toDisplay(usdAmount: number): string {
    const rate = rates[displayCurrency] ?? 1;
    return formatCurrency(usdAmount * rate, displayCurrency);
  }

  // Convert a limit amount that may be in its own currency to display currency
  function limitToDisplay(amount: number, limitCurrency: string): string {
    if (limitCurrency === displayCurrency) {
      return formatCurrency(amount, displayCurrency);
    }
    // Convert limitCurrency → USD → displayCurrency
    const toUsdRate      = rates[limitCurrency] ?? 1;
    const amountInUsd    = amount / toUsdRate;
    const toDisplayRate  = rates[displayCurrency] ?? 1;
    return formatCurrency(amountInUsd * toDisplayRate, displayCurrency);
  }

  const [preferredCurrency, setPreferredCurrency] = useState("USD");
  useEffect(() => {
    setPreferredCurrency(getPreferredCurrency());
  }, []);

  const { transactions } = useTransactions({ month, year, type: "expense" });

  const fetchLimits = useCallback(async () => {
    const res = await fetch(`/api/budgets?month=${month}&year=${year}`);
    setLimits(await res.json());
  }, [month, year]);

  useEffect(() => { fetchLimits(); }, [fetchLimits]);

  function prevMonth() {
    if (month === 1) { setMonth(12); setYear(y => y - 1); }
    else setMonth(m => m - 1);
  }
  function nextMonth() {
    if (month === 12) { setMonth(1); setYear(y => y + 1); }
    else setMonth(m => m + 1);
  }

  function openModal(cat: string) {
    const existing = limits.find(l => l.category === cat);
    setEditCat(cat);
    if (existing) {
      setLimitInput(existing.limitAmount);
      setCurrency(existing.currency);
    } else {
      setLimitInput("");
      setCurrency(preferredCurrency);
    }
    setShowModal(true);
  }

  async function handleSave() {
    if (!limitInput || Number(limitInput) <= 0) return;
    setSaving(true);
    try {
      await fetch("/api/budgets", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          category:    editCat,
          limitAmount: Number(limitInput),
          currency,
          month,
          year,
        }),
      });
      await fetchLimits();
      setShowModal(false);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(limitId: string) {
    if (!confirm("Remove this budget limit?")) return;
    setDeleting(limitId);
    try {
      const res = await fetch("/api/budgets", {
        method:  "DELETE",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ id: limitId }),
      });
      if (!res.ok) throw new Error("Delete failed");
      await fetchLimits();
    } catch (e) {
      alert("Could not delete budget. Please try again.");
      console.error(e);
    } finally {
      setDeleting(null);
    }
  }

  // Sum spending per category — amountUsd is already in USD
  const spendingByCategory: Record<string, number> = {};
  transactions.forEach(tx => {
    spendingByCategory[tx.category] =
      (spendingByCategory[tx.category] ?? 0) + Number(tx.amountUsd);
  });

  const expenseCategories = CATEGORIES.filter(c => c.name !== "Income");
  const displayCategories = expenseCategories.filter(cat =>
    spendingByCategory[cat.name] > 0 || limits.find(l => l.category === cat.name)
  );

  return (
    <PageTransition>
      <div className="space-y-4">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Budgets</h1>
            <p className="text-sm text-gray-400 mt-0.5">
              Set and track spending limits per category
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-xl px-1 self-start sm:self-auto">
              <button onClick={prevMonth} className="p-1.5 hover:bg-gray-50 rounded-lg transition-colors">
                <ChevronLeft className="w-4 h-4 text-gray-500" />
              </button>
              <span className="text-sm font-semibold text-gray-800 px-2 min-w-[110px] text-center">
                {MONTHS[month - 1]} {year}
              </span>
              <button onClick={nextMonth} className="p-1.5 hover:bg-gray-50 rounded-lg transition-colors">
                <ChevronRight className="w-4 h-4 text-gray-500" />
              </button>
            </div>
            <Button onClick={() => openModal(expenseCategories[0].name)} className="justify-center">
              <Plus className="w-4 h-4" /> Set budget
            </Button>
          </div>
        </div>

        {/* Empty state */}
        {displayCategories.length === 0 ? (
          <Card className="flex flex-col items-center justify-center py-16 gap-3">
            <span className="text-4xl">🎯</span>
            <p className="text-gray-400 text-sm">No budgets or spending this month yet.</p>
            <Button size="sm" onClick={() => openModal(expenseCategories[0].name)}>
              Set your first budget
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {displayCategories.map((cat, i) => {
              const limit = limits.find(l => l.category === cat.name);

              // spentUsd is in USD (from amountUsd column)
              const spentUsd = spendingByCategory[cat.name] ?? 0;

              // Cap is stored in whatever currency the user set —
              // convert it to USD for percentage comparison
              const capUsd = limit
                ? Number(limit.limitAmount) / (rates[limit.currency] ?? 1)
                : null;

              const pct    = capUsd ? Math.min(100, (spentUsd / capUsd) * 100) : null;
              const isOver = capUsd !== null && spentUsd > capUsd;
              const isWarn = capUsd !== null && pct !== null && pct >= 80 && !isOver;

              return (
                <motion.div
                  key={cat.name}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06, duration: 0.4 }}
                  whileHover={{ y: -2, transition: { duration: 0.15 } }}
                >
                  <Card className={cn(
                    "h-full",
                    isOver && "border-red-200 bg-red-50/30",
                    isWarn && "border-amber-200 bg-amber-50/30"
                  )}>
                    {/* Card header */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2 min-w-0">
                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-sm shrink-0"
                          style={{ background: getCategoryColor(cat.name) + "20" }}
                        >
                          {getCategoryIcon(cat.name)}
                        </div>
                        <span className="text-sm font-medium text-gray-800 truncate">
                          {cat.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        {isOver && <AlertTriangle className="w-4 h-4 text-red-500 mr-1" />}
                        {isWarn && <AlertTriangle className="w-4 h-4 text-amber-500 mr-1" />}
                        <button
                          onClick={() => openModal(cat.name)}
                          className="p-1.5 rounded-lg hover:bg-blue-50 text-gray-300 hover:text-blue-500 transition-colors"
                          title="Edit budget"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        {limit && (
                          <button
                            onClick={() => handleDelete(limit.id)}
                            disabled={deleting === limit.id}
                            className="p-1.5 rounded-lg hover:bg-red-50 text-gray-300 hover:text-red-500 transition-colors disabled:opacity-40"
                            title="Remove budget limit"
                          >
                            {deleting === limit.id
                              ? <span className="w-3.5 h-3.5 border-2 border-red-400 border-t-transparent rounded-full animate-spin block" />
                              : <Trash2 className="w-3.5 h-3.5" />
                            }
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Spent vs limit — BOTH in display currency */}
                    <div className="flex items-baseline justify-between mb-2">
                      <span className={cn(
                        "text-xl font-bold",
                        isOver ? "text-red-600" : "text-gray-900"
                      )}>
                        {toDisplay(spentUsd)}
                      </span>
                      {limit
                        ? <span className="text-xs text-gray-400">
                            of {limitToDisplay(Number(limit.limitAmount), limit.currency)} limit
                          </span>
                        : <button
                            onClick={() => openModal(cat.name)}
                            className="text-xs text-blue-500 hover:underline"
                          >
                            + set limit
                          </button>
                      }
                    </div>

                    {/* Progress bar */}
                    {capUsd !== null && pct !== null && (
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          transition={{ duration: 0.8, delay: 0.2 + i * 0.05, ease: "easeOut" }}
                          className={cn(
                            "h-full rounded-full",
                            isOver ? "bg-red-500" : isWarn ? "bg-amber-400" : "bg-green-500"
                          )}
                        />
                      </div>
                    )}

                    {isOver && capUsd !== null && (
                      <p className="text-xs text-red-500 mt-2 font-medium">
                        Over by {toDisplay(spentUsd - capUsd)}
                      </p>
                    )}
                    {isWarn && (
                      <p className="text-xs text-amber-600 mt-2 font-medium">
                        {(100 - pct!).toFixed(0)}% of budget remaining
                      </p>
                    )}
                    {!isOver && !isWarn && capUsd !== null && pct !== null && (
                      <p className="text-xs text-gray-400 mt-2">
                        {(100 - pct).toFixed(0)}% remaining
                      </p>
                    )}
                  </Card>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Modal */}
        <Modal open={showModal} onClose={() => setShowModal(false)} title="Set budget limit">
          <div className="space-y-4">
            <Select
              label="Category"
              value={editCat}
              onChange={e => {
                const cat = e.target.value;
                setEditCat(cat);
                const existing = limits.find(l => l.category === cat);
                if (existing) {
                  setLimitInput(existing.limitAmount);
                  setCurrency(existing.currency);
                } else {
                  setLimitInput("");
                  setCurrency(preferredCurrency);
                }
              }}
              options={expenseCategories.map(c => ({
                value: c.name,
                label: `${c.icon} ${c.name}`,
              }))}
            />
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Limit amount"
                type="number"
                min="1"
                step="0.01"
                placeholder="300.00"
                value={limitInput}
                onChange={e => setLimitInput(e.target.value)}
              />
              <Select
                label="Currency"
                value={currency}
                onChange={e => setCurrency(e.target.value)}
                options={SUPPORTED_CURRENCIES.map(c => ({
                  value: c.code,
                  label: `${c.code} (${c.symbol})`,
                }))}
              />
            </div>
            <p className="text-xs text-gray-400">
              Warning shows at 80% of limit.
            </p>
            <div className="flex gap-3">
              <Button variant="secondary" onClick={() => setShowModal(false)} className="flex-1">
                Cancel
              </Button>
              <Button onClick={handleSave} loading={saving} className="flex-1">
                Save limit
              </Button>
            </div>
          </div>
        </Modal>

      </div>
    </PageTransition>
  );
}