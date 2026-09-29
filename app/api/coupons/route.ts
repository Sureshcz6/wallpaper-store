import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { couponSchema } from "@/lib/validation";
import { getAdminSession } from "@/lib/auth";

export async function GET() {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const coupons = await prisma.coupon.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json({ coupons });
}

export async function POST(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = couponSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid coupon data.", issues: parsed.error.flatten() }, { status: 400 });
  }
  const data = parsed.data;

  const coupon = await prisma.coupon.create({
    data: {
      code: data.code.toUpperCase(),
      discountType: data.discountType,
      percentage: data.percentage,
      fixedAmount: data.fixedAmount,
      minimumOrder: data.minimumOrder,
      maximumDiscount: data.maximumDiscount,
      startDate: data.startDate ? new Date(data.startDate) : null,
      expiryDate: data.expiryDate ? new Date(data.expiryDate) : null,
      usageLimit: data.usageLimit,
      perCustomerLimit: data.perCustomerLimit,
      isActive: data.isActive
    }
  });
  return NextResponse.json({ coupon });
}
