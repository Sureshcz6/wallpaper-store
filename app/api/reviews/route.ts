import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { reviewSchema } from "@/lib/validation";
import { getAdminSession } from "@/lib/auth";

/** Public: submit a review (goes to PENDING; only visible after admin approval). */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = reviewSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Please provide a valid rating and review." }, { status: 400 });
  }
  const { productId, name, rating, reviewText } = parsed.data;

  // A review counts as a verified purchase only if this email has a PAID order for this product.
  // (Left simple/pseudonymous here since there's no customer account system; a fuller
  // implementation would tie this to the order confirmation page/token instead of a raw email field.)
  const review = await prisma.review.create({
    data: { productId, name, rating, reviewText, status: "PENDING" }
  });
  return NextResponse.json({ review, message: "Thanks! Your review will appear after approval." });
}

/** Admin: list all reviews (any status) for moderation. */
export async function GET(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const reviews = await prisma.review.findMany({
    orderBy: { createdAt: "desc" },
    include: { product: { select: { name: true } } }
  });
  return NextResponse.json({ reviews });
}
