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

import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { budgetRules } from "@/lib/schema";
import { eq, and } from "drizzle-orm";

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { grossIncome, netIncome } = await req.json();

  if (!grossIncome || grossIncome <= 0) {
    return NextResponse.json({ error: "grossIncome must be a positive number" }, { status: 400 });
  }

  const rules = await db
    .select()
    .from(budgetRules)
    .where(and(eq(budgetRules.userId, userId), eq(budgetRules.active, true)));

  rules.sort((a, b) => a.priority - b.priority);

  let remaining = grossIncome;
  const breakdown: {
    ruleId:    string;
    name:      string;
    category:  string;
    ruleType:  string;
    ruleBase:  string;
    value:     number;
    allocated: number;
    percentage: number; // percentage of gross income
  }[] = [];

  for (const rule of rules) {
    const base = rule.ruleBase === "net_income"
      ? (netIncome ?? grossIncome)
      : rule.ruleBase === "gross_income"
        ? grossIncome
        : grossIncome; // custom — use gross for now

    let allocated = 0;

    if (rule.ruleType === "percentage") {
      allocated = (Number(rule.value) / 100) * base;
    } else {
      // Fixed amount
      allocated = Number(rule.value);
    }

    // Don't allocate more than what's remaining
    allocated = Math.min(allocated, remaining);
    remaining = Math.max(0, remaining - allocated);

    breakdown.push({
      ruleId:    rule.id,
      name:      rule.name,
      category:  rule.category,
      ruleType:  rule.ruleType,
      ruleBase:  rule.ruleBase,
      value:     Number(rule.value),
      allocated: Math.round(allocated * 100) / 100,
      percentage: Math.round((allocated / grossIncome) * 10000) / 100,
    });
  }

  return NextResponse.json({
    grossIncome,
    netIncome:  netIncome ?? grossIncome,
    totalAllocated: Math.round((grossIncome - remaining) * 100) / 100,
    freeCash:   Math.round(remaining * 100) / 100,
    freeCashPct: Math.round((remaining / grossIncome) * 10000) / 100,
    breakdown,
  });
}