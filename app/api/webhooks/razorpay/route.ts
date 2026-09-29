import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyWebhookSignature } from "@/lib/razorpay";
import { generateDownloadToken } from "@/lib/utils";

/**
 * Server-to-server source of truth for payment status. Browser redirects
 * can be interrupted (closed tab, network drop) - the webhook is what
 * guarantees an order eventually gets marked PAID even if the client-side
 * verify call never completes. Must be idempotent: Razorpay retries
 * webhooks, so a repeated event id must not double-process an order.
 */
export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const signature = req.headers.get("x-razorpay-signature");

  if (!verifyWebhookSignature(rawBody, signature)) {
    return NextResponse.json({ error: "Invalid webhook signature." }, { status: 400 });
  }

  const event = JSON.parse(rawBody);
  const eventId: string | undefined = event.id;
  const eventType: string = event.event;

  const paymentEntity = event.payload?.payment?.entity;
  const razorpayOrderId: string | undefined = paymentEntity?.order_id;
  if (!razorpayOrderId) {
    return NextResponse.json({ received: true });
  }

  const order = await prisma.order.findUnique({ where: { razorpayOrderId } });
  if (!order) {
    return NextResponse.json({ received: true });
  }

  const processedIds = Array.isArray(order.webhookEventIds) ? (order.webhookEventIds as string[]) : [];
  if (eventId && processedIds.includes(eventId)) {
    return NextResponse.json({ received: true, duplicate: true });
  }

  if (eventType === "payment.captured" && order.paymentStatus !== "PAID") {
    const downloadToken = order.downloadToken ?? generateDownloadToken();
    await prisma.order.update({
      where: { id: order.id },
      data: {
        paymentStatus: "PAID",
        deliveryStatus: "AVAILABLE",
        razorpayPaymentId: paymentEntity.id,
        downloadToken,
        webhookEventIds: eventId ? [...processedIds, eventId] : processedIds
      }
    });
  } else if (eventType === "payment.failed") {
    await prisma.order.update({
      where: { id: order.id },
      data: {
        paymentStatus: "FAILED",
        webhookEventIds: eventId ? [...processedIds, eventId] : processedIds
      }
    });
  } else if (eventId) {
    await prisma.order.update({
      where: { id: order.id },
      data: { webhookEventIds: [...processedIds, eventId] }
    });
  }

  return NextResponse.json({ received: true });
}
