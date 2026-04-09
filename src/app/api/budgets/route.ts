// src/app/api/budgets/route.ts
//
// GET  /api/budgets?month=4&year=2025  → get budget limits for a month
// POST /api/budgets                    → set or update a budget limit
//
// A budget limit is: "I want to spend at most $300 on Food in April 2025"
// If a limit already exists for that category+month+year, we update it (upsert).

import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { budgetLimits } from "@/lib/schema";
import { eq, and } from "drizzle-orm";
import { generateId } from "@/lib/utils";

export async function GET(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = req.nextUrl;
  const month = Number(searchParams.get("month"));
  const year  = Number(searchParams.get("year"));

  const rows = await db
    .select()
    .from(budgetLimits)
    .where(
      and(
        eq(budgetLimits.userId, userId),
        eq(budgetLimits.month, month),
        eq(budgetLimits.year, year)
      )
    );

  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { category, limitAmount, currency, month, year } = await req.json();

  if (!category || !limitAmount || !month || !year) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  // Check if a limit already exists for this category + month + year
  const existing = await db
    .select()
    .from(budgetLimits)
    .where(
      and(
        eq(budgetLimits.userId, userId),
        eq(budgetLimits.category, category),
        eq(budgetLimits.month, month),
        eq(budgetLimits.year, year)
      )
    );

  if (existing.length > 0) {
    // Update the existing limit
    await db
      .update(budgetLimits)
      .set({ limitAmount: String(limitAmount), currency: currency ?? "USD" })
      .where(eq(budgetLimits.id, existing[0].id));
    return NextResponse.json({ ...existing[0], limitAmount: String(limitAmount) });
  }

  // Otherwise insert a new one
  const newLimit = {
    id:          generateId(),
    userId,
    category,
    limitAmount: String(limitAmount),
    currency:    currency ?? "USD",
    month,
    year,
  };

  await db.insert(budgetLimits).values(newLimit);
  return NextResponse.json(newLimit, { status: 201 });
}