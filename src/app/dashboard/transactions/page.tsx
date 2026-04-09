// src/app/dashboard/transactions/page.tsx
"use client";

import { useState } from "react";
import { useTransactions } from "@/hooks/useTransactions";
import { CATEGORIES, getCategoryColor, getCategoryIcon } from "@/lib/categories";
import { formatCurrency, MONTHS } from "@/lib/utils";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import TransactionForm from "@/components/dashboard/TransactionForm";
import type { Transaction } from "@/hooks/useTransactions";
import { Plus, Search, Trash2, Pencil, ChevronLeft, ChevronRight, Filter } from "lucide-react";

export default function TransactionsPage() {
  const now = new Date();
  const [month,    setMonth]    = useState(now.getMonth() + 1);
  const [year,     setYear]     = useState(now.getFullYear());
  const [search,   setSearch]   = useState("");
  const [category, setCategory] = useState("");
  const [type,     setType]     = useState("");
  const [modal,    setModal]    = useState<null | "add" | Transaction>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

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
      alert("Could not delete. Check console.");
      console.error(e);
    } finally {
      setDeleting(null);
    }
  }

  const totalIncome  = transactions.filter(t => t.type === "income").reduce((s,t)  => s + Number(t.amountUsd), 0);
  const totalExpense = transactions.filter(t => t.type === "expense").reduce((s,t) => s + Number(t.amountUsd), 0);

  return (
    <div className="space-y-4">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Transactions</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            {transactions.length} transaction{transactions.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Button onClick={() => setModal("add")} className="w-full sm:w-auto justify-center">
          <Plus className="w-4 h-4" /> Add transaction
        </Button>
      </div>

      {/* Month nav + summary strip */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white border border-gray-100 rounded-2xl px-4 py-3">
        <div className="flex items-center gap-1">
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
        <div className="flex items-center gap-4 sm:gap-6 text-sm">
          <div>
            <span className="text-gray-400 text-xs block">Income</span>
            <span className="font-semibold text-green-600">+{formatCurrency(totalIncome)}</span>
          </div>
          <div>
            <span className="text-gray-400 text-xs block">Expenses</span>
            <span className="font-semibold text-red-500">-{formatCurrency(totalExpense)}</span>
          </div>
          <div>
            <span className="text-gray-400 text-xs block">Balance</span>
            <span className={`font-semibold ${totalIncome - totalExpense >= 0 ? "text-blue-600" : "text-red-500"}`}>
              {formatCurrency(totalIncome - totalExpense)}
            </span>
          </div>
        </div>
      </div>

      {/* Filters */}
      <Card className="p-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <div className="flex items-center gap-2 flex-1">
            <Filter className="w-4 h-4 text-gray-300 shrink-0" />
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              <input
                type="text"
                placeholder="Search…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-2 text-sm text-gray-900 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-gray-400"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <select
              value={category}
              onChange={e => setCategory(e.target.value)}
              className="flex-1 sm:flex-none text-sm text-gray-900 border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="">All categories</option>
              {CATEGORIES.map(c => (
                <option key={c.name} value={c.name}>{c.icon} {c.name}</option>
              ))}
            </select>
            <select
              value={type}
              onChange={e => setType(e.target.value)}
              className="flex-1 sm:flex-none text-sm text-gray-900 border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="">All types</option>
              <option value="income">Income</option>
              <option value="expense">Expense</option>
            </select>
            {(search || category || type) && (
              <button
                onClick={() => { setSearch(""); setCategory(""); setType(""); }}
                className="text-xs text-gray-400 hover:text-gray-600 px-2 whitespace-nowrap"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </Card>

      {/* List */}
      <Card className="p-0 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-sm text-gray-300">
            Loading…
          </div>
        ) : transactions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <span className="text-3xl">💸</span>
            <p className="text-sm text-gray-400">No transactions found</p>
            <Button size="sm" variant="secondary" onClick={() => setModal("add")}>
              Add your first one
            </Button>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {transactions.map(tx => (
              <div
                key={tx.id}
                className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors group"
              >
                {/* Icon */}
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center text-base shrink-0"
                  style={{ background: getCategoryColor(tx.category) + "18" }}
                >
                  {getCategoryIcon(tx.category)}
                </div>

                {/* Name + meta */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{tx.name}</p>
                  <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                    <span
                      className="text-xs px-1.5 py-0.5 rounded-md font-medium"
                      style={{
                        background: getCategoryColor(tx.category) + "18",
                        color: getCategoryColor(tx.category),
                      }}
                    >
                      {tx.category}
                    </span>
                    <span className="text-xs text-gray-400">
                      {new Date(tx.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </span>
                    {tx.note && (
                      <span className="text-xs text-gray-400 truncate max-w-[140px] hidden sm:inline">
                        · {tx.note}
                      </span>
                    )}
                  </div>
                </div>

                {/* Amount + actions */}
                <div className="flex items-center gap-2 shrink-0">
                  <span className={`text-sm font-semibold ${tx.type === "income" ? "text-green-600" : "text-red-500"}`}>
                    {tx.type === "income" ? "+" : "-"}{formatCurrency(Number(tx.amount), tx.currency)}
                  </span>
                  {/* On mobile always show buttons; on desktop show on hover */}
                  <div className="flex items-center gap-0.5 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
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
                        ? <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin block" />
                        : <Trash2 className="w-3.5 h-3.5" />
                      }
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Add modal */}
      <Modal open={modal === "add"} onClose={() => setModal(null)} title="Add transaction">
        <TransactionForm
          onSuccess={() => { setModal(null); refetch(); }}
          onCancel={() => setModal(null)}
        />
      </Modal>

      {/* Edit modal */}
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
  );
}