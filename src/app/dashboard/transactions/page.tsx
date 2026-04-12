// src/app/dashboard/transactions/page.tsx
"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTransactions } from "@/hooks/useTransactions";
import { useCurrency } from "@/hooks/useCurrency";
import { CATEGORIES, getCategoryColor, getCategoryIcon } from "@/lib/categories";
import { formatCurrency, getPreferredCurrency, MONTHS } from "@/lib/utils";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import TransactionForm from "@/components/dashboard/TransactionForm";
import PageTransition from "@/components/ui/PageTransition";
import type { Transaction } from "@/hooks/useTransactions";
import {
  Plus, Search, Trash2, Pencil,
  ChevronLeft, ChevronRight, Filter, SlidersHorizontal,
} from "lucide-react";

export default function TransactionsPage() {
  const now = new Date();
  const [month,    setMonth]    = useState(now.getMonth() + 1);
  const [year,     setYear]     = useState(now.getFullYear());
  const [search,   setSearch]   = useState("");
  const [category, setCategory] = useState("");
  const [type,     setType]     = useState("");
  const [modal,    setModal]    = useState<null | "add" | Transaction>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  // Preferred display currency
  const [displayCurrency, setDisplayCurrency] = useState("USD");
  const { rates } = useCurrency();

  useEffect(() => {
    setDisplayCurrency(getPreferredCurrency());
  }, []);

  // Convert a USD-normalised amount to the display currency
  function toDisplay(usdAmount: number): string {
    const rate      = rates[displayCurrency] ?? 1;
    const converted = usdAmount * rate;
    return formatCurrency(converted, displayCurrency);
  }

  const { transactions, loading, refetch } = useTransactions({
    month, year, search, category, type,
  });

  function prevMonth() {
    if (month === 1) { setMonth(12); setYear(y => y - 1); }
    else setMonth(m => m - 1);
  }
  function nextMonth() {
    if (month === 12) { setMonth(1); setYear(y => y + 1); }
    else setMonth(m => m + 1);
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this transaction?")) return;
    setDeleting(id);
    try {
      const res = await fetch(`/api/transactions/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      refetch();
    } catch (e) {
      alert("Could not delete. Please try again.");
      console.error(e);
    } finally {
      setDeleting(null);
    }
  }

  // Sum amountUsd then convert to display currency
  const totalIncome  = transactions
    .filter(t => t.type === "income")
    .reduce((s, t) => s + Number(t.amountUsd), 0);
  const totalExpense = transactions
    .filter(t => t.type === "expense")
    .reduce((s, t) => s + Number(t.amountUsd), 0);
  const totalBalance = totalIncome - totalExpense;

  const hasActiveFilters = !!(search || category || type);

  return (
    <PageTransition>
      <div className="space-y-4">

        {/* ── Header ── */}
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Transactions</h1>
            <p className="text-sm text-gray-400 mt-0.5">
              {transactions.length} transaction{transactions.length !== 1 ? "s" : ""}
              {hasActiveFilters && " (filtered)"}
            </p>
          </div>
          <Button onClick={() => setModal("add")} size="md">
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Add transaction</span>
            <span className="sm:hidden">Add</span>
          </Button>
        </div>

        {/* ── Month nav + summary strip ── */}
        <div className="bg-white border border-gray-100 rounded-2xl px-4 py-3 space-y-3">
          {/* Month navigator — centered on mobile */}
          <div className="flex items-center justify-between">
            <button
              onClick={prevMonth}
              className="p-2 hover:bg-gray-50 rounded-xl transition-colors"
            >
              <ChevronLeft className="w-4 h-4 text-gray-500" />
            </button>
            <span className="text-sm font-semibold text-gray-800">
              {MONTHS[month - 1]} {year}
            </span>
            <button
              onClick={nextMonth}
              className="p-2 hover:bg-gray-50 rounded-xl transition-colors"
            >
              <ChevronRight className="w-4 h-4 text-gray-500" />
            </button>
          </div>

          {/* Summary row — 3 equal columns always */}
          <div className="grid grid-cols-3 divide-x divide-gray-100">
            <div className="text-center px-2">
              <p className="text-[11px] text-gray-400 mb-0.5">Income</p>
              <p className="text-sm font-semibold text-green-600 truncate">
                +{toDisplay(totalIncome)}
              </p>
            </div>
            <div className="text-center px-2">
              <p className="text-[11px] text-gray-400 mb-0.5">Expenses</p>
              <p className="text-sm font-semibold text-red-500 truncate">
                -{toDisplay(totalExpense)}
              </p>
            </div>
            <div className="text-center px-2">
              <p className="text-[11px] text-gray-400 mb-0.5">Balance</p>
              <p className={`text-sm font-semibold truncate ${
                totalBalance >= 0 ? "text-blue-600" : "text-red-500"
              }`}>
                {toDisplay(totalBalance)}
              </p>
            </div>
          </div>
        </div>

        {/* ── Filters ── */}
        <Card className="p-3">
          {/* Search + toggle button */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              <input
                type="text"
                placeholder="Search transactions…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-2 text-sm text-gray-900 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-gray-400"
              />
            </div>
            {/* Toggle filters button — shows on all sizes */}
            <button
              onClick={() => setShowFilters(f => !f)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-sm font-medium transition-colors ${
                showFilters || hasActiveFilters
                  ? "border-blue-200 bg-blue-50 text-blue-600"
                  : "border-gray-200 text-gray-500 hover:bg-gray-50"
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Filters</span>
              {hasActiveFilters && (
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
              )}
            </button>
          </div>

          {/* Expandable filter row */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="pt-3 flex flex-col sm:flex-row gap-2">
                  <select
                    value={category}
                    onChange={e => setCategory(e.target.value)}
                    className="flex-1 text-sm text-gray-900 border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    <option value="">All categories</option>
                    {CATEGORIES.map(c => (
                      <option key={c.name} value={c.name}>{c.icon} {c.name}</option>
                    ))}
                  </select>
                  <select
                    value={type}
                    onChange={e => setType(e.target.value)}
                    className="flex-1 text-sm text-gray-900 border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    <option value="">All types</option>
                    <option value="income">💰 Income</option>
                    <option value="expense">💸 Expense</option>
                  </select>
                  {hasActiveFilters && (
                    <button
                      onClick={() => { setSearch(""); setCategory(""); setType(""); }}
                      className="text-sm text-red-400 hover:text-red-600 font-medium px-3 py-2 rounded-xl hover:bg-red-50 transition-colors whitespace-nowrap"
                    >
                      Clear all
                    </button>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </Card>

        {/* ── Transaction list ── */}
        <Card className="p-0 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : transactions.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-16 gap-3 px-4 text-center"
            >
              <span className="text-4xl">
                {hasActiveFilters ? "🔍" : "💸"}
              </span>
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">
                  {hasActiveFilters
                    ? "No transactions match your filters"
                    : `No transactions in ${MONTHS[month - 1]} ${year}`}
                </p>
                <p className="text-xs text-gray-400">
                  {hasActiveFilters
                    ? "Try clearing your filters or searching something else"
                    : "Add your first transaction to get started"}
                </p>
              </div>
              {hasActiveFilters ? (
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => { setSearch(""); setCategory(""); setType(""); }}
                >
                  Clear filters
                </Button>
              ) : (
                <Button size="sm" onClick={() => setModal("add")}>
                  <Plus className="w-3.5 h-3.5" /> Add transaction
                </Button>
              )}
            </motion.div>
          ) : (
            <AnimatePresence>
              <div className="divide-y divide-gray-50">
                {transactions.map((tx, i) => (
                  <motion.div
                    key={tx.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ delay: i * 0.03, duration: 0.3 }}
                    className="flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50 transition-colors group"
                  >
                    {/* Category icon */}
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center text-base shrink-0"
                      style={{ background: getCategoryColor(tx.category) + "18" }}
                    >
                      {getCategoryIcon(tx.category)}
                    </div>

                    {/* Name + meta — takes all available space */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">
                        {tx.name}
                      </p>
                      <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                        <span
                          className="text-xs px-1.5 py-0.5 rounded-md font-medium"
                          style={{
                            background: getCategoryColor(tx.category) + "18",
                            color:      getCategoryColor(tx.category),
                          }}
                        >
                          {tx.category}
                        </span>
                        <span className="text-xs text-gray-400">
                          {new Date(tx.date).toLocaleDateString("en-US", {
                            month: "short",
                            day:   "numeric",
                            year:  "numeric",
                          })}
                        </span>
                        {tx.note && (
                          <span className="text-xs text-gray-400 truncate max-w-[100px] hidden sm:inline">
                            · {tx.note}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Amount + action buttons */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className={`text-sm font-semibold ${
                        tx.type === "income" ? "text-green-600" : "text-red-500"
                      }`}>
                        {tx.type === "income" ? "+" : "-"}
                        {formatCurrency(Number(tx.amount), tx.currency)}
                      </span>

                      {/* Edit + delete — always visible on mobile, hover on desktop */}
                      <div className="flex items-center gap-0.5 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => setModal(tx)}
                          className="p-1.5 rounded-lg hover:bg-blue-50 text-gray-300 hover:text-blue-500 transition-colors"
                          title="Edit"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(tx.id)}
                          disabled={deleting === tx.id}
                          className="p-1.5 rounded-lg hover:bg-red-50 text-gray-300 hover:text-red-500 transition-colors disabled:opacity-40"
                          title="Delete"
                        >
                          {deleting === tx.id
                            ? <span className="w-3.5 h-3.5 border-2 border-red-400 border-t-transparent rounded-full animate-spin block" />
                            : <Trash2 className="w-3.5 h-3.5" />
                          }
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </AnimatePresence>
          )}
        </Card>

        {/* ── Modals ── */}
        <Modal
          open={modal === "add"}
          onClose={() => setModal(null)}
          title="Add transaction"
        >
          <TransactionForm
            onSuccess={() => { setModal(null); refetch(); }}
            onCancel={() => setModal(null)}
          />
        </Modal>

        <Modal
          open={typeof modal === "object" && modal !== null}
          onClose={() => setModal(null)}
          title="Edit transaction"
        >
          {typeof modal === "object" && modal !== null && (
            <TransactionForm
              transaction={modal}
              onSuccess={() => { setModal(null); refetch(); }}
              onCancel={() => setModal(null)}
            />
          )}
        </Modal>

      </div>
    </PageTransition>
  );
}