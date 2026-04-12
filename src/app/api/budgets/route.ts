// src/app/api/budgets/route.ts

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
    await db
      .update(budgetLimits)
      .set({ limitAmount: String(limitAmount), currency: currency ?? "USD" })
      .where(eq(budgetLimits.id, existing[0].id));
    return NextResponse.json({ ...existing[0], limitAmount: String(limitAmount) });
  }

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

export async function DELETE(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Read the budget id from the request body
  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  await db
    .delete(budgetLimits)
    .where(and(eq(budgetLimits.id, id), eq(budgetLimits.userId, userId)));

  return NextResponse.json({ success: true });
}