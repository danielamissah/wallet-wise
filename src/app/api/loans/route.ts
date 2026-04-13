// src/app/api/loans/route.ts
// GET  /api/loans       — list all loans for the user
// POST /api/loans       — create a new loan

import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { loans, loanPayments } from "@/lib/schema";
import { eq, desc } from "drizzle-orm";
import { generateId } from "@/lib/utils";

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rows = await db
    .select()
    .from(loans)
    .where(eq(loans.userId, userId))
    .orderBy(desc(loans.createdAt));

  // For each loan, attach its payments
  const withPayments = await Promise.all(
    rows.map(async loan => {
      const payments = await db
        .select()
        .from(loanPayments)
        .where(eq(loanPayments.loanId, loan.id))
        .orderBy(desc(loanPayments.date));
      return { ...loan, payments };
    })
  );

  return NextResponse.json(withPayments);
}

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const {
    name, lender, totalAmount, interestRate,
    monthlyPayment, currency, startDate, notes,
  } = body;

  if (!name || !totalAmount || !monthlyPayment || !startDate) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  // Calculate next payment date (1 month from start)
  const start = new Date(startDate);
  const nextPayment = new Date(start);
  nextPayment.setMonth(nextPayment.getMonth() + 1);

  const newLoan = {
    id:               generateId(),
    userId,
    name,
    lender:           lender ?? null,
    totalAmount:      String(totalAmount),
    remainingBalance: String(totalAmount), // starts at full amount
    interestRate:     String(interestRate ?? 0),
    monthlyPayment:   String(monthlyPayment),
    currency:         currency ?? "USD",
    startDate:        start,
    nextPaymentDate:  nextPayment,
    paidOff:          false,
    notes:            notes ?? null,
  };

  await db.insert(loans).values(newLoan);
  return NextResponse.json({ ...newLoan, payments: [] }, { status: 201 });
}