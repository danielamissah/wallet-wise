// src/app/api/rules/calculate/route.ts
// POST /api/rules/calculate
//
// Body: { grossIncome: number, netIncome?: number, currency: string }
// Returns: breakdown of how income is allocated across all active rules
//
// Rules are applied in priority order.
// Percentage rules are calculated against the specified base.
// Fixed rules deduct a set amount.
// "Free cash" = what remains after all rules are applied.

// src/app/api/rules/calculate/route.ts
import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { budgetRules, recurringTransactions } from "@/lib/schema";
import { eq, and } from "drizzle-orm";
import { fetchExchangeRates, convertToUsd } from "@/lib/currencies";

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { grossIncome, netIncome } = await req.json();

  if (!grossIncome || grossIncome <= 0) {
    return NextResponse.json({ error: "grossIncome must be positive" }, { status: 400 });
  }

  const rates = await fetchExchangeRates();

  // ── Budget rules (sorted by priority) ────────────────────────────────────
  const rules = await db
    .select()
    .from(budgetRules)
    .where(and(eq(budgetRules.userId, userId), eq(budgetRules.active, true)));

  rules.sort((a, b) => a.priority - b.priority);

  let remaining = grossIncome;

  const breakdown: {
    id:         string;
    name:       string;
    category:   string;
    type:       "rule" | "recurring";
    ruleType?:  string;
    ruleBase?:  string;
    value:      number;
    allocated:  number;
    percentage: number;
    currency:   string;
  }[] = [];

  // Apply rules first
  for (const rule of rules) {
    const base = rule.ruleBase === "net_income"
      ? (netIncome ?? grossIncome)
      : grossIncome;

    let allocated = rule.ruleType === "percentage"
      ? (Number(rule.value) / 100) * base
      : convertToUsd(Number(rule.value), rule.currency, rates);

    allocated = Math.min(allocated, remaining);
    remaining = Math.max(0, remaining - allocated);

    breakdown.push({
      id:        rule.id,
      name:      rule.name,
      category:  rule.category,
      type:      "rule",
      ruleType:  rule.ruleType,
      ruleBase:  rule.ruleBase,
      value:     Number(rule.value),
      allocated: Math.round(allocated * 100) / 100,
      percentage: Math.round((allocated / grossIncome) * 10000) / 100,
      currency:  rule.currency,
    });
  }

  // ── Recurring expenses ────────────────────────────────────────────────────
  // Convert each to monthly USD equivalent
  const recurringItems = await db
    .select()
    .from(recurringTransactions)
    .where(and(
      eq(recurringTransactions.userId, userId),
      eq(recurringTransactions.active, true),
      eq(recurringTransactions.type, "expense"),
    ));

  for (const item of recurringItems) {
    const amountUsd = convertToUsd(Number(item.amount), item.currency, rates);

    // Convert to monthly equivalent
    const monthlyUsd =
      item.frequency === "weekly"   ? amountUsd * 4.33 :
      item.frequency === "biweekly" ? amountUsd * 2.17 :
      amountUsd; // monthly

    const allocated = Math.min(monthlyUsd, remaining);
    remaining = Math.max(0, remaining - allocated);

    breakdown.push({
      id:        item.id,
      name:      item.name,
      category:  item.category,
      type:      "recurring",
      value:     Number(item.amount),
      allocated: Math.round(allocated * 100) / 100,
      percentage: Math.round((allocated / grossIncome) * 10000) / 100,
      currency:  item.currency,
    });
  }

  return NextResponse.json({
    grossIncome,
    netIncome:      netIncome ?? grossIncome,
    totalAllocated: Math.round((grossIncome - remaining) * 100) / 100,
    freeCash:       Math.round(remaining * 100) / 100,
    freeCashPct:    Math.round((remaining / grossIncome) * 10000) / 100,
    breakdown,
  });
}