"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useAnalytics } from "@/hooks/useAnalytics";
import { useTransactions } from "@/hooks/useTransactions";
import { formatCurrency, MONTHS } from "@/lib/utils";
import { getCategoryColor, getCategoryIcon } from "@/lib/categories";
import StatCard from "@/components/dashboard/StatCard";
import Card from "@/components/ui/Card";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import TransactionForm from "@/components/dashboard/TransactionForm";
import PageTransition from "@/components/ui/PageTransition";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line,
} from "recharts";
import { Plus, TrendingUp, TrendingDown, Wallet, ChevronLeft, ChevronRight } from "lucide-react";

export default function DashboardPage() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year,  setYear]  = useState(now.getFullYear());
  const [showAdd, setShowAdd] = useState(false);

  const { data, loading } = useAnalytics(month, year);
  const { transactions, refetch } = useTransactions({ month, year });

  function prevMonth() { if (month === 1) { setMonth(12); setYear(y => y-1); } else setMonth(m => m-1); }
  function nextMonth() { if (month === 12) { setMonth(1); setYear(y => y+1); } else setMonth(m => m+1); }

  const income  = transactions.filter(t => t.type === "income").reduce((s,t)  => s + Number(t.amountUsd), 0);
  const expense = transactions.filter(t => t.type === "expense").reduce((s,t) => s + Number(t.amountUsd), 0);
  const balance = income - expense;

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="bg-white border border-gray-100 rounded-xl px-3 py-2 shadow-lg text-xs">
        <p className="font-semibold text-gray-700 mb-1">{label}</p>
        {payload.map((p: any) => (
          <p key={p.name} style={{ color: p.color }}>{p.name}: {formatCurrency(p.value)}</p>
        ))}
      </div>
    );
  };

  return (
    <PageTransition>
      <div className="space-y-6">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Overview</h1>
            <p className="text-sm text-gray-400 mt-0.5">Your financial snapshot</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-xl px-1">
              <button onClick={prevMonth} className="p-1.5 hover:bg-gray-50 rounded-lg transition-colors">
                <ChevronLeft className="w-4 h-4 text-gray-500" />
              </button>
              <span className="text-sm font-medium text-gray-700 px-2 min-w-[110px] text-center">
                {MONTHS[month-1]} {year}
              </span>
              <button onClick={nextMonth} className="p-1.5 hover:bg-gray-50 rounded-lg transition-colors">
                <ChevronRight className="w-4 h-4 text-gray-500" />
              </button>
            </div>
            <Button onClick={() => setShowAdd(true)}>
              <Plus className="w-4 h-4" /> Add transaction
            </Button>
          </div>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard label="Total income"   value={formatCurrency(income)}  color="green" icon={<TrendingUp  className="w-4 h-4" />} delay={0}    />
          <StatCard label="Total expenses" value={formatCurrency(expense)} color="red"   icon={<TrendingDown className="w-4 h-4" />} delay={0.08} />
          <StatCard label="Balance"        value={formatCurrency(balance)} color={balance >= 0 ? "blue" : "red"} icon={<Wallet className="w-4 h-4" />} delay={0.16} />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Bar chart */}
          <Card animate delay={0.1}>
            <h2 className="text-sm font-semibold text-gray-700 mb-1">Income vs expenses</h2>
            <p className="text-xs text-gray-400 mb-4">Last 6 months</p>
            {loading ? (
              <div className="h-48 flex items-center justify-center">
                <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={data?.monthlyTotals ?? []} barGap={4}>
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} tickFormatter={v => `$${v}`} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="income"  name="Income"   fill="#22c55e" radius={[4,4,0,0]} />
                  <Bar dataKey="expense" name="Expenses" fill="#f87171" radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </Card>

          {/* Pie chart */}
          <Card animate delay={0.15}>
            <h2 className="text-sm font-semibold text-gray-700 mb-1">Spending by category</h2>
            <p className="text-xs text-gray-400 mb-4">This month</p>
            {loading ? (
              <div className="h-48 flex items-center justify-center">
                <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (data?.categoryBreakdown ?? []).length === 0 ? (
              <div className="h-48 flex flex-col items-center justify-center gap-2">
                <span className="text-3xl">📊</span>
                <p className="text-sm text-gray-300">No expenses yet</p>
              </div>
            ) : (
              <div className="flex items-center gap-4">
                <ResponsiveContainer width="50%" height={160}>
                  <PieChart>
                    <Pie data={data?.categoryBreakdown} dataKey="total" nameKey="category"
                      cx="50%" cy="50%" innerRadius={45} outerRadius={70}>
                      {data?.categoryBreakdown.map(entry => (
                        <Cell key={entry.category} fill={getCategoryColor(entry.category)} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v: number) => formatCurrency(v)}
                      contentStyle={{ borderRadius: 12, fontSize: 12, border: "1px solid #f0f0f0" }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex-1 space-y-2">
                  {data?.categoryBreakdown.slice(0, 5).map(entry => (
                    <motion.div key={entry.category}
                      initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}
                      className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ background: getCategoryColor(entry.category) }} />
                        <span className="text-xs text-gray-600">{entry.category}</span>
                      </div>
                      <span className="text-xs font-medium text-gray-700">{formatCurrency(entry.total)}</span>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
          </Card>
        </div>

        {/* Line chart */}
        <Card animate delay={0.2}>
          <h2 className="text-sm font-semibold text-gray-700 mb-1">Daily spending</h2>
          <p className="text-xs text-gray-400 mb-4">{MONTHS[month-1]} {year}</p>
          {loading ? (
            <div className="h-36 flex items-center justify-center">
              <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={140}>
              <LineChart data={data?.dailySpending ?? []}>
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} tickFormatter={v => `$${v}`} />
                <Tooltip formatter={(v: number) => formatCurrency(v)}
                  contentStyle={{ borderRadius: 12, fontSize: 12, border: "1px solid #f0f0f0" }} />
                <Line type="monotone" dataKey="amount" stroke="#3b82f6" strokeWidth={2} dot={false}
                  activeDot={{ r: 4, fill: "#3b82f6" }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </Card>

        {/* Bottom row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Top expenses */}
          <Card animate delay={0.25}>
            <h2 className="text-sm font-semibold text-gray-700 mb-4">Top expenses</h2>
            {(data?.topExpenses ?? []).length === 0 ? (
              <p className="text-sm text-gray-300 text-center py-6">No expenses yet</p>
            ) : (
              <div className="space-y-3">
                {data?.topExpenses.map((tx, i) => (
                  <motion.div key={tx.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + i * 0.06 }}
                    className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl flex items-center justify-center text-base"
                        style={{ background: getCategoryColor(tx.category) + "18" }}>
                        {getCategoryIcon(tx.category)}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-800">{tx.name}</p>
                        <p className="text-xs text-gray-400">{tx.category}</p>
                      </div>
                    </div>
                    <span className="text-sm font-semibold text-red-500">
                      -{formatCurrency(tx.amount, tx.currency)}
                    </span>
                  </motion.div>
                ))}
              </div>
            )}
          </Card>

          {/* Recent transactions */}
          <Card animate delay={0.3}>
            <h2 className="text-sm font-semibold text-gray-700 mb-4">Recent transactions</h2>
            {transactions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-6 gap-2">
                <span className="text-2xl">💸</span>
                <p className="text-sm text-gray-300">No transactions yet</p>
                <Button size="sm" variant="secondary" onClick={() => setShowAdd(true)}>Add one</Button>
              </div>
            ) : (
              <div className="space-y-2.5">
                {transactions.slice(0, 5).map((tx, i) => (
                  <motion.div key={tx.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 + i * 0.06 }}
                    className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center text-sm"
                        style={{ background: getCategoryColor(tx.category) + "22" }}>
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
                  </motion.div>
                ))}
              </div>
            )}
          </Card>
        </div>

        <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Add transaction">
          <TransactionForm onSuccess={() => { setShowAdd(false); refetch(); }} onCancel={() => setShowAdd(false)} />
        </Modal>
      </div>
    </PageTransition>
  );
}