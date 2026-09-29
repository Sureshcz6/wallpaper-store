import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyPaymentSchema } from "@/lib/validation";
import { verifyPaymentSignature } from "@/lib/razorpay";
import { generateDownloadToken } from "@/lib/utils";
import { getWhatsAppStatus, renderTemplate, sendWhatsAppMessage } from "@/lib/whatsapp";

/**
 * Step 2 of checkout: the browser posts back what Razorpay Checkout returned.
 * We NEVER trust that on its own - we recompute the HMAC signature
 * server-side against our stored order before marking anything as paid.
 * This route is also safe to call twice (idempotent) - if the order is
 * already PAID we just return its existing delivery info.
 */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = verifyPaymentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payment verification request." }, { status: 400 });
  }
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId } = parsed.data;

  const order = await prisma.order.findUnique({ where: { id: orderId }, include: { product: true } });
  if (!order) {
    return NextResponse.json({ error: "Order not found." }, { status: 404 });
  }

  if (order.razorpayOrderId !== razorpay_order_id) {
    return NextResponse.json({ error: "Payment could not be completed. Please try again." }, { status: 400 });
  }

  // Idempotent: already verified earlier (e.g. webhook beat us to it, or a retry).
  if (order.paymentStatus === "PAID" && order.downloadToken) {
    return NextResponse.json(buildSuccessResponse(order));
  }

  const validSignature = verifyPaymentSignature({
    orderId: razorpay_order_id,
    paymentId: razorpay_payment_id,
    signature: razorpay_signature
  });

  if (!validSignature) {
    await prisma.order.update({ where: { id: order.id }, data: { paymentStatus: "FAILED" } });
    return NextResponse.json({ error: "Payment could not be completed. Please try again." }, { status: 400 });
  }

  const downloadToken = generateDownloadToken();
  const expiryHours = order.product.linkExpiryHours;
  const downloadExpiresAt = expiryHours ? new Date(Date.now() + expiryHours * 3600 * 1000) : null;

  const updated = await prisma.order.update({
    where: { id: order.id },
    data: {
      paymentStatus: "PAID",
      deliveryStatus: "AVAILABLE",
      razorpayPaymentId: razorpay_payment_id,
      razorpaySignature: razorpay_signature,
      downloadToken,
      downloadExpiresAt
    },
    include: { product: true }
  });

  // Best-effort WhatsApp confirmation. Never blocks a successful payment.
  if (getWhatsAppStatus() === "CONNECTED" && updated.product.whatsappMessageTemplate) {
    const message = renderTemplate(updated.product.whatsappMessageTemplate, {
      customer_name: updated.customerName,
      product_name: updated.product.name,
      order_id: updated.orderNumber,
      amount: (updated.amount / 100).toString(),
      delivery_link: `${process.env.NEXT_PUBLIC_SITE_URL}/download/${downloadToken}`
    });
    const result = await sendWhatsAppMessage({ toPhone: updated.customerPhone, message });
    if (result.sent) {
      await prisma.order.update({ where: { id: updated.id }, data: { whatsappSent: true } });
    }
  }

  return NextResponse.json(buildSuccessResponse(updated));
}

function buildSuccessResponse(order: {
  orderNumber: string;
  customerName: string;
  amount: number;
  downloadToken: string | null;
  product: { name: string };
}) {
  return {
    success: true,
    orderNumber: order.orderNumber,
    customerName: order.customerName,
    productName: order.product.name,
    amount: order.amount,
    downloadUrl: order.downloadToken ? `/download/${order.downloadToken}` : null
  };
}
