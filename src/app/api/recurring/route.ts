// src/app/api/recurring/route.ts
// GET  /api/recurring  — list all recurring transactions
// POST /api/recurring  — create a new recurring transaction

import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { recurringTransactions } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { generateId } from "@/lib/utils";

function calcNextDue(frequency: string, dayOfPeriod: number): Date {
  const now  = new Date();
  const next = new Date();

  if (frequency === "monthly") {
    // Set to this month's day, or next month if already passed
    next.setDate(dayOfPeriod);
    if (next <= now) next.setMonth(next.getMonth() + 1);
  } else if (frequency === "weekly") {
    // dayOfPeriod = 0 (Sun) to 6 (Sat)
    const diff = (dayOfPeriod - now.getDay() + 7) % 7 || 7;
    next.setDate(now.getDate() + diff);
  } else if (frequency === "biweekly") {
    const diff = (dayOfPeriod - now.getDay() + 7) % 7 || 14;
    next.setDate(now.getDate() + diff);
  }

  return next;
}

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rows = await db
    .select()
    .from(recurringTransactions)
    .where(eq(recurringTransactions.userId, userId));

  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { name, amount, type, category, currency, frequency, dayOfPeriod, notes } = body;

  if (!name || !amount || !type || !category || !frequency) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const nextDue = calcNextDue(frequency, dayOfPeriod ?? 1);

  const item = {
    id:          generateId(),
    userId,
    name,
    amount:      String(amount),
    type,
    category,
    currency:    currency ?? "USD",
    frequency,
    dayOfPeriod: dayOfPeriod ?? 1,
    active:      true,
    nextDue,
    notes:       notes ?? null,
  };

  await db.insert(recurringTransactions).values(item);
  return NextResponse.json(item, { status: 201 });
}