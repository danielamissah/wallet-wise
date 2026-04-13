// src/app/api/loans/[id]/route.ts
// PATCH  /api/loans/:id  — update loan details or mark paid off
// DELETE /api/loans/:id  — delete a loan and all its payments

import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { loans } from "@/lib/schema";
import { eq, and } from "drizzle-orm";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, ctx: Ctx) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await ctx.params;
  const body    = await req.json();
  const updates: Record<string, unknown> = {};

  if (body.name             !== undefined) updates.name             = body.name;
  if (body.lender           !== undefined) updates.lender           = body.lender;
  if (body.remainingBalance !== undefined) updates.remainingBalance = String(body.remainingBalance);
  if (body.monthlyPayment   !== undefined) updates.monthlyPayment   = String(body.monthlyPayment);
  if (body.interestRate     !== undefined) updates.interestRate     = String(body.interestRate);
  if (body.nextPaymentDate  !== undefined) updates.nextPaymentDate  = new Date(body.nextPaymentDate);
  if (body.paidOff          !== undefined) updates.paidOff          = body.paidOff;
  if (body.notes            !== undefined) updates.notes            = body.notes;

  await db.update(loans).set(updates)
    .where(and(eq(loans.id, id), eq(loans.userId, userId)));

  return NextResponse.json({ success: true });
}

export async function DELETE(_req: NextRequest, ctx: Ctx) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await ctx.params;

  await db.delete(loans)
    .where(and(eq(loans.id, id), eq(loans.userId, userId)));

  return NextResponse.json({ success: true });
}