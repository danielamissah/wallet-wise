// src/app/api/analytics/route.ts
//
// GET /api/analytics?month=4&year=2025
//
// Returns everything the dashboard charts need in one request:
// - monthlyTotals: income + expense for each of the last 6 months (bar chart)
// - categoryBreakdown: total spent per category this month (donut chart)
// - dailySpending: spending per day this month (line chart)
// - topExpenses: the 5 biggest expenses this month

import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { transactions } from "@/lib/schema";
import { eq, and, gte, lte, desc } from "drizzle-orm";
import { MONTHS } from "@/lib/utils";

export async function GET(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = req.nextUrl;
  const month = Number(searchParams.get("month") ?? new Date().getMonth() + 1);
  const year  = Number(searchParams.get("year")  ?? new Date().getFullYear());

  // --- 1. Monthly totals for the last 6 months ---
  // We calculate the start month by going back 5 months from current
  const sixMonthsAgo = new Date(year, month - 6, 1);
  const endOfMonth   = new Date(year, month, 1);

  const allTx = await db
    .select()
    .from(transactions)
    .where(
      and(
        eq(transactions.userId, userId),
        gte(transactions.date, sixMonthsAgo),
        lte(transactions.date, endOfMonth)
      )
    );

  // Group by month label and sum income / expenses
  // We use amountUsd so all currencies are comparable
  const monthMap: Record<string, { income: number; expense: number }> = {};

  for (let i = 5; i >= 0; i--) {
    let m = month - 1 - i; // 0-indexed
    let y = year;
    while (m < 0) { m += 12; y--; }
    const label = `${MONTHS[m]} ${y !== year ? y : ""}`.trim();
    monthMap[label] = { income: 0, expense: 0 };
  }

  allTx.forEach(tx => {
    const d = new Date(tx.date);
    const label = `${MONTHS[d.getMonth()]} ${d.getFullYear() !== year ? d.getFullYear() : ""}`.trim();
    if (!monthMap[label]) return;
    const amt = Number(tx.amountUsd);
    if (tx.type === "income")  monthMap[label].income  += amt;
    if (tx.type === "expense") monthMap[label].expense += amt;
  });

  const monthlyTotals = Object.entries(monthMap).map(([month, vals]) => ({
    month,
    income:  Math.round(vals.income  * 100) / 100,
    expense: Math.round(vals.expense * 100) / 100,
  }));

  // --- 2. Category breakdown for the current month ---
  const startOfCurrentMonth = new Date(year, month - 1, 1);
  const endOfCurrentMonth   = new Date(year, month, 1);

  const currentMonthExpenses = allTx.filter(tx => {
    const d = new Date(tx.date);
    return (
      tx.type === "expense" &&
      d >= startOfCurrentMonth &&
      d < endOfCurrentMonth
    );
  });

  const catMap: Record<string, number> = {};
  currentMonthExpenses.forEach(tx => {
    catMap[tx.category] = (catMap[tx.category] ?? 0) + Number(tx.amountUsd);
  });

  const categoryBreakdown = Object.entries(catMap)
    .map(([category, total]) => ({ category, total: Math.round(total * 100) / 100 }))
    .sort((a, b) => b.total - a.total);

  // --- 3. Daily spending for the current month (line chart) ---
  const dailyMap: Record<number, number> = {};
  currentMonthExpenses.forEach(tx => {
    const day = new Date(tx.date).getDate();
    dailyMap[day] = (dailyMap[day] ?? 0) + Number(tx.amountUsd);
  });

  const daysInMonth = new Date(year, month, 0).getDate();
  const dailySpending = Array.from({ length: daysInMonth }, (_, i) => ({
    day: i + 1,
    amount: Math.round((dailyMap[i + 1] ?? 0) * 100) / 100,
  }));

  // --- 4. Top 5 expenses this month ---
  const topExpenses = [...currentMonthExpenses]
    .sort((a, b) => Number(b.amountUsd) - Number(a.amountUsd))
    .slice(0, 5)
    .map(tx => ({
      id:       tx.id,
      name:     tx.name,
      amount:   Number(tx.amount),
      amountUsd: Number(tx.amountUsd),
      currency: tx.currency,
      category: tx.category,
    }));

  return NextResponse.json({
    monthlyTotals,
    categoryBreakdown,
    dailySpending,
    topExpenses,
  });
}