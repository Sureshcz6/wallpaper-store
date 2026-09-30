import { computeDiscountPercent } from "@/lib/utils";

export function serializeProduct(p: any) {
  const reviews = p.reviews ?? [];

  const avgRating = reviews.length
    ? Math.round(
        (
          reviews.reduce(
            (s: number, r: any) =>
              s + r.rating,
            0
          ) / reviews.length
        ) * 10
      ) / 10
    : 0;

  return {
    id: p.id,
    name: p.name,
    slug: p.slug,

    category: p.category
      ? {
          name: p.category.name,
          slug: p.category.slug,
        }
      : null,

    shortDescription: p.shortDescription,
    thumbnailUrl: p.thumbnailUrl,

    price: p.price,
    originalPrice: p.originalPrice,

    discountPercent:
      computeDiscountPercent(
        p.originalPrice,
        p.price
      ),

    rating: avgRating,
    reviewCount: reviews.length,

    isFeatured: p.isFeatured,
    isBestseller: p.isBestseller,
    isLimitedOffer: p.isLimitedOffer,
  };
}