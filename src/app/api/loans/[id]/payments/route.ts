// src/app/api/loans/[id]/payments/route.ts
// POST /api/loans/:id/payments — log a payment against a loan
// This updates the loan's remaining balance automatically

import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { loans, loanPayments } from "@/lib/schema";
import { eq, and } from "drizzle-orm";
import { generateId } from "@/lib/utils";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, ctx: Ctx) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await ctx.params;
  const body    = await req.json();
  const { amount, date, notes } = body;

  if (!amount || !date) {
    return NextResponse.json({ error: "Missing amount or date" }, { status: 400 });
  }

  // Fetch the loan to get current balance and interest rate
  const [loan] = await db.select().from(loans)
    .where(and(eq(loans.id, id), eq(loans.userId, userId)));

  if (!loan) return NextResponse.json({ error: "Loan not found" }, { status: 404 });

  const currentBalance = Number(loan.remainingBalance);
  const annualRate     = Number(loan.interestRate) / 100;
  const monthlyRate    = annualRate / 12;

  // Calculate interest vs principal split
  const interestPaid  = monthlyRate > 0 ? currentBalance * monthlyRate : 0;
  const principalPaid = Math.min(Number(amount) - interestPaid, currentBalance);
  const newBalance    = Math.max(0, currentBalance - principalPaid);
  const paidOff       = newBalance <= 0;

  // Calculate next payment date (advance by frequency period)
  const nextPayment = new Date(date);
  nextPayment.setMonth(nextPayment.getMonth() + 1);

  // Record the payment
  const payment = {
    id:            generateId(),
    userId,
    loanId:        id,
    amount:        String(amount),
    principalPaid: String(Math.max(0, principalPaid)),
    interestPaid:  String(Math.max(0, interestPaid)),
    date:          new Date(date),
    notes:         notes ?? null,
  };

  await db.insert(loanPayments).values(payment);

  // Update loan balance + next payment date + paid off status
  await db.update(loans).set({
    remainingBalance: String(newBalance),
    nextPaymentDate:  paidOff ? null : nextPayment,
    paidOff,
  }).where(eq(loans.id, id));

  return NextResponse.json({ payment, newBalance, paidOff }, { status: 201 });
}