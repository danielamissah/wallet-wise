// src/app/api/transactions/[id]/route.ts

import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { transactions } from "@/lib/schema";
import { eq, and } from "drizzle-orm";
import { autoCategorize } from "@/lib/categories";
import { fetchExchangeRates, convertToUsd } from "@/lib/currencies";

// Next.js 15: params is a Promise, must be awaited
type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, ctx: RouteContext) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Await params — this is the key fix for Next.js 15
  const { id } = await ctx.params;

  const body = await req.json();
  const { name, amount, type, category, currency, date, note } = body;

  const resolvedCategory =
    (!category || category === "auto") && name ? autoCategorize(name) : category;

  // Recalculate amountUsd any time amount or currency is provided
  let amountUsd: string | undefined;
  if (amount !== undefined && currency) {
    const rates = await fetchExchangeRates();
    amountUsd = String(convertToUsd(Number(amount), currency, rates));
  }

  // Only include fields that were actually sent in the request
  const updates: Record<string, unknown> = {};
  if (name              !== undefined) updates.name      = name;
  if (amount            !== undefined) updates.amount    = String(amount); // must be string for numeric column
  if (type              !== undefined) updates.type      = type;
  if (resolvedCategory  !== undefined) updates.category  = resolvedCategory;
  if (currency          !== undefined) updates.currency  = currency;
  if (amountUsd         !== undefined) updates.amountUsd = amountUsd;
  if (date              !== undefined) updates.date      = new Date(date);
  if (note              !== undefined) updates.note      = note ?? null;

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "No fields to update" }, { status: 400 });
  }

  await db
    .update(transactions)
    .set(updates)
    .where(and(eq(transactions.id, id), eq(transactions.userId, userId)));

  return NextResponse.json({ success: true });
}

export async function DELETE(req: NextRequest, ctx: RouteContext) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await ctx.params;

  await db
    .delete(transactions)
    .where(and(eq(transactions.id, id), eq(transactions.userId, userId)));

  return NextResponse.json({ success: true });
}