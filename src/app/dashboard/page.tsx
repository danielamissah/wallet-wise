// src/app/dashboard/page.tsx
//
// This is the main dashboard overview page.
// It's a Client Component because it uses hooks for state and data fetching.
// If it were a Server Component, we couldn't use useState or useEffect.

"use client";

import { useState } from "react";
import { useAnalytics } from "@/hooks/useAnalytics";
import { useTransactions } from "@/hooks/useTransactions";
import { formatCurrency, formatMonthYear, MONTHS } from "@/lib/utils";
import { getCategoryColor, getCategoryIcon } from "@/lib/categories";
import StatCard from "@/components/dashboard/StatCard";
import Card from "@/components/ui/Card";
import Modal from "@/components/ui/Modal";
import TransactionForm from "@/components/dashboard/TransactionForm";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line,
} from "recharts";
import { Plus, TrendingUp, TrendingDown, Wallet, ChevronLeft, ChevronRight } from "lucide-react";
import Button from "@/components/ui/Button";

export default function DashboardPage() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1); // 1-indexed
  const [year,  setYear]  = useState(now.getFullYear());
  const [showAddModal, setShowAddModal] = useState(false);

  const { data, loading } = useAnalytics(month, year);
  const { transactions, refetch } = useTransactions({ month, year });

  // Navigate between months
  function prevMonth() {
    if (month === 1) { setMonth(12); setYear(y => y - 1); }
    else setMonth(m => m - 1);
  }
  function nextMonth() {
    if (month === 12) { setMonth(1); setYear(y => y + 1); }
    else setMonth(m => m + 1);
  }

  // Calculate totals from current transactions
  const income  = transactions.filter(t => t.type === "income").reduce((s, t) => s + Number(t.amountUsd), 0);
  const expense = transactions.filter(t => t.type === "expense").reduce((s, t) => s + Number(t.amountUsd), 0);
  const balance = income - expense;

  return (
    <div className="space-y-6">

      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Overview</h1>
          <p className="text-sm text-gray-400 mt-0.5">Your financial snapshot</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Month navigator */}
          <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-xl px-1">
            <button onClick={prevMonth} className="p-1.5 hover:bg-gray-50 rounded-lg transition-colors">
              <ChevronLeft className="w-4 h-4 text-gray-500" />
            </button>
            <span className="text-sm font-medium text-gray-700 px-2 min-w-[110px] text-center">
              {MONTHS[month - 1]} {year}
            </span>
            <button onClick={nextMonth} className="p-1.5 hover:bg-gray-50 rounded-lg transition-colors">
              <ChevronRight className="w-4 h-4 text-gray-500" />
            </button>
          </div>
          <Button onClick={() => setShowAddModal(true)} size="md">
            <Plus className="w-4 h-4" /> Add transaction
          </Button>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-3 gap-4">
        <StatCard
          label="Total income"
          value={formatCurrency(income)}
          color="green"
          icon={<TrendingUp className="w-4 h-4" />}
        />
        <StatCard
          label="Total expenses"
          value={formatCurrency(expense)}
          color="red"
          icon={<TrendingDown className="w-4 h-4" />}
        />
        <StatCard
          label="Balance"
          value={formatCurrency(balance)}
          color={balance >= 0 ? "blue" : "red"}
          icon={<Wallet className="w-4 h-4" />}
        />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-2 gap-4">

        {/* Bar chart — 6-month income vs expenses */}
        <Card>
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Income vs expenses</h2>
          {loading ? (
            <div className="h-48 flex items-center justify-center text-gray-300 text-sm">Loading…</div>
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={data?.monthlyTotals ?? []} barGap={4}>
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} tickFormatter={v => `$${v}`} />
                <Tooltip formatter={(v: number) => formatCurrency(v)} contentStyle={{ borderRadius: 12, border: "1px solid #f0f0f0", fontSize: 12 }} />
                <Bar dataKey="income"  name="Income"   fill="#22c55e" radius={[4,4,0,0]} />
                <Bar dataKey="expense" name="Expenses" fill="#f87171" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>

        {/* Pie chart — spending by category */}
        <Card>
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Spending by category</h2>
          {loading ? (
            <div className="h-48 flex items-center justify-center text-gray-300 text-sm">Loading…</div>
          ) : (data?.categoryBreakdown ?? []).length === 0 ? (
            <div className="h-48 flex items-center justify-center text-gray-300 text-sm">No expenses this month</div>
          ) : (
            <div className="flex items-center gap-4">
              <ResponsiveContainer width="50%" height={160}>
                <PieChart>
                  <Pie
                    data={data?.categoryBreakdown}
                    dataKey="total"
                    nameKey="category"
                    cx="50%" cy="50%"
                    innerRadius={45}
                    outerRadius={70}
                  >
                    {data?.categoryBreakdown.map((entry) => (
                      <Cell key={entry.category} fill={getCategoryColor(entry.category)} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: number) => formatCurrency(v)} contentStyle={{ borderRadius: 12, fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
              {/* Legend */}
              <div className="flex-1 space-y-1.5">
                {data?.categoryBreakdown.slice(0, 5).map(entry => (
                  <div key={entry.category} className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ background: getCategoryColor(entry.category) }} />
                      <span className="text-xs text-gray-600">{entry.category}</span>
                    </div>
                    <span className="text-xs font-medium text-gray-700">{formatCurrency(entry.total)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* Daily spending line chart */}
      <Card>
        <h2 className="text-sm font-semibold text-gray-700 mb-4">Daily spending — {MONTHS[month-1]} {year}</h2>
        {loading ? (
          <div className="h-36 flex items-center justify-center text-gray-300 text-sm">Loading…</div>
        ) : (
          <ResponsiveContainer width="100%" height={140}>
            <LineChart data={data?.dailySpending ?? []}>
              <XAxis dataKey="day" tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} tickFormatter={v => `$${v}`} />
              <Tooltip formatter={(v: number) => formatCurrency(v)} contentStyle={{ borderRadius: 12, fontSize: 12 }} />
              <Line type="monotone" dataKey="amount" stroke="#3b82f6" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </Card>

      {/* Top expenses + recent transactions */}
      <div className="grid grid-cols-2 gap-4">

        {/* Top 5 expenses */}
        <Card>
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Top expenses</h2>
          {(data?.topExpenses ?? []).length === 0 ? (
            <p className="text-sm text-gray-300 text-center py-6">No expenses yet</p>
          ) : (
            <div className="space-y-3">
              {data?.topExpenses.map(tx => (
                <div key={tx.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="text-lg">{getCategoryIcon(tx.category)}</span>
                    <div>
                      <p className="text-sm font-medium text-gray-800">{tx.name}</p>
                      <p className="text-xs text-gray-400">{tx.category}</p>
                    </div>
                  </div>
                  <span className="text-sm font-semibold text-red-500">
                    -{formatCurrency(tx.amount, tx.currency)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Recent transactions */}
        <Card>
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Recent transactions</h2>
          {transactions.length === 0 ? (
            <p className="text-sm text-gray-300 text-center py-6">No transactions yet</p>
          ) : (
            <div className="space-y-2.5">
              {transactions.slice(0, 5).map(tx => (
                <div key={tx.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-sm"
                      style={{ background: getCategoryColor(tx.category) + "22" }}
                    >
                      {getCategoryIcon(tx.category)}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-800 leading-tight">{tx.name}</p>
                      <p className="text-xs text-gray-400">{new Date(tx.date).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <span className={`text-sm font-semibold ${tx.type === "income" ? "text-green-600" : "text-red-500"}`}>
                    {tx.type === "income" ? "+" : "-"}{formatCurrency(Number(tx.amount), tx.currency)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>

      </div>

      {/* Add transaction modal */}
      <Modal open={showAddModal} onClose={() => setShowAddModal(false)} title="Add transaction">
        <TransactionForm
          onSuccess={() => { setShowAddModal(false); refetch(); }}
          onCancel={() => setShowAddModal(false)}
        />
      </Modal>

    </div>
  );
}