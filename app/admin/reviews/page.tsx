import { prisma } from "@/lib/db";
import { ReviewsModeration } from "@/components/admin/ReviewsModeration";

export default async function AdminReviewsPage() {
  const reviews = await prisma.review.findMany({
    orderBy: { createdAt: "desc" },
    include: { product: { select: { name: true } } }
  });
  return (
    <div>
      <h1 className="mb-6 font-display text-2xl text-ink">Reviews</h1>
      <ReviewsModeration reviews={reviews as any} />
    </div>
  );
}
