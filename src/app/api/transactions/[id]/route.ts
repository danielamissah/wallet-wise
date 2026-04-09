// src/app/api/transactions/[id]/route.ts
//
// PATCH  /api/transactions/:id  → update a transaction
// DELETE /api/transactions/:id  → delete a transaction
//
// We always verify the transaction belongs to the current user before touching it.
// This prevents one user from editing another user's data (called an IDOR vulnerability).

import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { transactions } from "@/lib/schema";
import { eq, and } from "drizzle-orm";
import { autoCategorize } from "@/lib/categories";
import { fetchExchangeRates, convertToUsd } from "@/lib/currencies";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { name, amount, type, category, currency, date, note } = body;

  const resolvedCategory = (!category || category === "auto") && name
    ? autoCategorize(name)
    : category;

  // Re-convert to USD if amount or currency changed
  let amountUsd: string | undefined;
  if (amount && currency) {
    const rates = await fetchExchangeRates();
    amountUsd = String(convertToUsd(Number(amount), currency, rates));
  }

  // Build only the fields that were actually sent
  // This way a PATCH can update just one field without wiping the rest
  const updates: Record<string, unknown> = {};
  if (name)              updates.name     = name;
  if (amount)            updates.amount   = String(amount);
  if (type)              updates.type     = type;
  if (resolvedCategory)  updates.category = resolvedCategory;
  if (currency)          updates.currency = currency;
  if (amountUsd)         updates.amountUsd = amountUsd;
  if (date)              updates.date     = new Date(date);
  if (note !== undefined) updates.note    = note;

  // and() ensures we only update the row if it belongs to this user
  await db
    .update(transactions)
    .set(updates)
    .where(and(eq(transactions.id, params.id), eq(transactions.userId, userId)));

  return NextResponse.json({ success: true });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await db
    .delete(transactions)
    .where(and(eq(transactions.id, params.id), eq(transactions.userId, userId)));

  return NextResponse.json({ success: true });
}