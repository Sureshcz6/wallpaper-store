import { prisma } from "@/lib/db";
import { CouponManager } from "@/components/admin/CouponManager";

export default async function AdminCouponsPage() {
  const coupons = await prisma.coupon.findMany({ orderBy: { createdAt: "desc" } });
  return (
    <div>
      <h1 className="mb-6 font-display text-2xl text-ink">Coupons</h1>
      <CouponManager coupons={coupons as any} />
    </div>
  );
}
