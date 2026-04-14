// src/app/api/loans/[id]/route.ts
// PATCH  /api/loans/:id  — update loan details or mark paid off
// DELETE /api/loans/:id  — delete a loan and all its payments

// src/app/api/loans/[id]/route.ts
import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { loans } from "@/lib/schema";
import { eq, and } from "drizzle-orm";
import { fetchExchangeRates, convertToUsd } from "@/lib/currencies";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, ctx: Ctx) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id }  = await ctx.params;
  const body    = await req.json();
  const updates: Record<string, unknown> = {};

  if (body.name             !== undefined) updates.name             = body.name;
  if (body.lender           !== undefined) updates.lender           = body.lender ?? null;
  if (body.interestRate     !== undefined) updates.interestRate     = String(body.interestRate);
  if (body.currency         !== undefined) updates.currency         = body.currency;
  if (body.nextPaymentDate  !== undefined) updates.nextPaymentDate  = body.nextPaymentDate ? new Date(body.nextPaymentDate) : null;
  if (body.paidOff          !== undefined) updates.paidOff          = body.paidOff;
  if (body.notes            !== undefined) updates.notes            = body.notes ?? null;

  // If totalAmount changes, we also need to recalculate remainingBalance
  // Only if explicitly changing the total (not just a payment update)
  if (body.totalAmount !== undefined) {
    updates.totalAmount = String(body.totalAmount);
  }
  if (body.remainingBalance !== undefined) {
    updates.remainingBalance = String(body.remainingBalance);
  }
  if (body.monthlyPayment !== undefined) {
    // null/empty means no fixed monthly payment
    updates.monthlyPayment = body.monthlyPayment
      ? String(body.monthlyPayment)
      : "0";
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "No fields to update" }, { status: 400 });
  }

  await db
    .update(loans)
    .set(updates)
    .where(and(eq(loans.id, id), eq(loans.userId, userId)));

  return NextResponse.json({ success: true });
}

export async function DELETE(_req: NextRequest, ctx: Ctx) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await ctx.params;

  await db
    .delete(loans)
    .where(and(eq(loans.id, id), eq(loans.userId, userId)));

  return NextResponse.json({ success: true });
}