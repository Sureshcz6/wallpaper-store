import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSignedDownloadUrl, isStorageConfigured } from "@/lib/storage";

/**
 * Only path that ever hands out access to a purchased file. Requires:
 * - a token that matches a real order,
 * - that order's payment to be verified PAID,
 * - the link to not be expired,
 * - the configured download limit (if any) to not be exceeded.
 * Serves short-lived signed URLs rather than permanent storage links.
 */
export async function GET(req: NextRequest, { params }: { params: { token: string } }) {
  const order = await prisma.order.findUnique({
    where: { downloadToken: params.token },
    include: { product: { include: { files: true } } }
  });

  if (!order || order.paymentStatus !== "PAID") {
    return NextResponse.json({ error: "This download link is invalid." }, { status: 404 });
  }

  if (order.downloadExpiresAt && new Date() > order.downloadExpiresAt) {
    await prisma.order.update({ where: { id: order.id }, data: { deliveryStatus: "EXPIRED" } });
    return NextResponse.json({ error: "This download link has expired." }, { status: 410 });
  }

  const limit = order.product.downloadLimit;
  if (limit && order.downloadCount >= limit) {
    return NextResponse.json({ error: "This download link has reached its download limit." }, { status: 410 });
  }

  // External-delivery products (e.g. a hosted course URL) skip signed files.
  if (order.product.externalDeliveryUrl) {
    await bumpDownloadCount(order.id);
    return NextResponse.json({
      type: "external",
      url: order.product.externalDeliveryUrl,
      instructions: order.product.deliveryInstructions ?? null
    });
  }

  if (!isStorageConfigured()) {
    return NextResponse.json({ error: "Downloads are temporarily unavailable. Please contact support." }, { status: 503 });
  }

  const signedFiles = await Promise.all(
    order.product.files.map(async (f) => ({
      fileName: f.fileName,
      url: await getSignedDownloadUrl(f.storageKey)
    }))
  );

  await bumpDownloadCount(order.id);

  return NextResponse.json({
    type: "files",
    files: signedFiles,
    instructions: order.product.deliveryInstructions ?? null
  });
}

async function bumpDownloadCount(orderId: string) {
  await prisma.order.update({
    where: { id: orderId },
    data: { downloadCount: { increment: 1 }, deliveryStatus: "DELIVERED" }
  });
}
