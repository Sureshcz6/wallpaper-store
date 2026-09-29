import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { formatINR } from "@/lib/utils";

/** Preview-only endpoint for the checkout UI. Final calculation always happens again, server-side, in /api/orders/create. */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const code = body?.code?.trim()?.toUpperCase();
  const productId = body?.productId;
  if (!code || !productId) {
    return NextResponse.json({ valid: false, message: "Enter a coupon code." }, { status: 400 });
  }

  const [coupon, product] = await Promise.all([
    prisma.coupon.findUnique({ where: { code } }),
    prisma.product.findUnique({ where: { id: productId } })
  ]);

  if (!product) return NextResponse.json({ valid: false, message: "Product not found." }, { status: 404 });
  if (!coupon || !coupon.isActive) {
    return NextResponse.json({ valid: false, message: "This coupon is invalid or expired." });
  }
  const now = new Date();
  if ((coupon.startDate && now < coupon.startDate) || (coupon.expiryDate && now > coupon.expiryDate)) {
    return NextResponse.json({ valid: false, message: "This coupon is invalid or expired." });
  }
  if (coupon.minimumOrder && product.price < coupon.minimumOrder) {
    return NextResponse.json({ valid: false, message: "This coupon requires a higher order amount." });
  }

  let discount = 0;
  if (coupon.discountType === "PERCENTAGE" && coupon.percentage) {
    discount = Math.round((product.price * coupon.percentage) / 100);
    if (coupon.maximumDiscount) discount = Math.min(discount, coupon.maximumDiscount);
  } else if (coupon.fixedAmount) {
    discount = coupon.fixedAmount;
  }
  const finalAmount = Math.max(product.price - discount, 100);

  return NextResponse.json({
    valid: true,
    finalAmount,
    finalAmountDisplay: formatINR(finalAmount),
    discountDisplay: formatINR(discount)
  });
}
