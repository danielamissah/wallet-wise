// src/app/api/reviews/route.ts
//
// GET  /api/reviews  → fetch approved reviews (public, no auth needed)
// POST /api/reviews  → submit a review (auth required)

import { auth, currentUser } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { reviews } from "@/lib/schema";
import { eq, desc } from "drizzle-orm";
import { generateId } from "@/lib/utils";

export async function GET() {
  const rows = await db
    .select()
    .from(reviews)
    .where(eq(reviews.approved, true))
    .orderBy(desc(reviews.createdAt))
    .limit(20);

  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get the user's real name from Clerk
  const user = await currentUser();
  const userName =
    user?.fullName ??
    user?.firstName ??
    user?.emailAddresses?.[0]?.emailAddress?.split("@")[0] ??
    "Anonymous";

  const { rating, comment } = await req.json();

  if (!rating || rating < 1 || rating > 5) {
    return NextResponse.json({ error: "Rating must be between 1 and 5" }, { status: 400 });
  }
  if (!comment?.trim()) {
    return NextResponse.json({ error: "Please write a comment" }, { status: 400 });
  }
  if (comment.trim().length < 10) {
    return NextResponse.json({ error: "Comment must be at least 10 characters" }, { status: 400 });
  }

  const newReview = {
    id:       generateId(),
    userId,
    userName,
    rating,
    comment:  comment.trim(),
    approved: true,
  };

  await db.insert(reviews).values(newReview);
  return NextResponse.json(newReview, { status: 201 });
}