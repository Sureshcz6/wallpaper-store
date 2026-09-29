import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { checkoutSchema } from "@/lib/validation";
import { getRazorpayClient, isRazorpayConfigured } from "@/lib/razorpay";
import { generateOrderNumber } from "@/lib/utils";

/**
 * Step 1 of checkout: validate the customer + product + coupon server-side,
 * compute the final amount ourselves (never trust a client-sent amount),
 * create a Razorpay Order, and store our own Order row in CREATED state.
 */
export async function POST(req: NextRequest) {
  if (!isRazorpayConfigured()) {
    return NextResponse.json(
      { error: "Payments are not configured yet. Please contact support." },
      { status: 503 }
    );
  }

  const body = await req.json().catch(() => null);
  const parsed = checkoutSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid checkout details.", issues: parsed.error.flatten() }, { status: 400 });
  }
  const { productId, customerName, customerEmail, customerPhone, couponCode } = parsed.data;

  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product || product.status !== "PUBLISHED") {
    return NextResponse.json({ error: "This product is currently unavailable." }, { status: 404 });
  }

  let finalAmount = product.price;
  let couponId: string | null = null;

  if (couponCode) {
    const coupon = await prisma.coupon.findUnique({ where: { code: couponCode.toUpperCase() } });
    const validation = await validateCouponForOrder(coupon, product.price, customerEmail);
    if (!validation.ok) {
      return NextResponse.json({ error: validation.message }, { status: 400 });
    }
    finalAmount = validation.finalAmount!;
    couponId = coupon!.id;
  }

  const orderNumber = generateOrderNumber();

  const razorpay = getRazorpayClient();
  const razorpayOrder = await razorpay.orders.create({
    amount: finalAmount, // paise
    currency: "INR",
    receipt: orderNumber,
    notes: { productId: product.id, productName: product.name }
  });

  const order = await prisma.order.create({
    data: {
      orderNumber,
      customerName,
      customerEmail,
      customerPhone,
      productId: product.id,
      couponId,
      amount: finalAmount,
      currency: "INR",
      razorpayOrderId: razorpayOrder.id,
      paymentStatus: "CREATED",
      deliveryStatus: "PENDING"
    }
  });

  return NextResponse.json({
    orderId: order.id,
    razorpayOrderId: razorpayOrder.id,
    amount: finalAmount,
    currency: "INR",
    keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
    productName: product.name,
    customerName,
    customerEmail,
    customerPhone
  });
}

async function validateCouponForOrder(
  coupon: Awaited<ReturnType<typeof prisma.coupon.findUnique>>,
  productPrice: number,
  customerEmail: string
): Promise<{ ok: boolean; message?: string; finalAmount?: number }> {
  if (!coupon || !coupon.isActive) {
    return { ok: false, message: "This coupon is invalid or expired." };
  }
  const now = new Date();
  if (coupon.startDate && now < coupon.startDate) {
    return { ok: false, message: "This coupon is not active yet." };
  }
  if (coupon.expiryDate && now > coupon.expiryDate) {
    return { ok: false, message: "This coupon is invalid or expired." };
  }
  if (coupon.minimumOrder && productPrice < coupon.minimumOrder) {
    return { ok: false, message: "This coupon requires a higher order amount." };
  }
  if (coupon.usageLimit) {
    const totalUsage = await prisma.order.count({
      where: { couponId: coupon.id, paymentStatus: "PAID" }
    });
    if (totalUsage >= coupon.usageLimit) {
      return { ok: false, message: "This coupon has reached its usage limit." };
    }
  }
  if (coupon.perCustomerLimit) {
    const customerUsage = await prisma.order.count({
      where: { couponId: coupon.id, customerEmail, paymentStatus: "PAID" }
    });
    if (customerUsage >= coupon.perCustomerLimit) {
      return { ok: false, message: "You have already used this coupon." };
    }
  }

  let discount = 0;
  if (coupon.discountType === "PERCENTAGE" && coupon.percentage) {
    discount = Math.round((productPrice * coupon.percentage) / 100);
    if (coupon.maximumDiscount) discount = Math.min(discount, coupon.maximumDiscount);
  } else if (coupon.discountType === "FIXED" && coupon.fixedAmount) {
    discount = coupon.fixedAmount;
  }

  const finalAmount = Math.max(productPrice - discount, 100); // never below ₹1
  return { ok: true, finalAmount };
}
