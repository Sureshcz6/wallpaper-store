import Link from "next/link";
import Image from "next/image";
import { formatINR } from "@/lib/utils";

export type ProductCardData = {
  id: string;
  name: string;
  slug: string;
  shortDescription: string;
  thumbnailUrl: string;
  price: number;
  originalPrice: number;
  discountPercent: number;
  rating: number;
  reviewCount: number;
  isBestseller?: boolean;
  category?: { name: string } | null;
};

export function ProductCard({ product }: { product: ProductCardData }) {
  return (
    <div className="group rounded-card border border-border bg-surface transition-transform duration-200 hover:-translate-y-1">
      <Link href={`/product/${product.slug}`} className="block">
        <div className="relative aspect-[4/3] w-full overflow-hidden rounded-t-card bg-black/30">
          <Image
            src={product.thumbnailUrl}
            alt={product.name}
            fill
            sizes="(max-width: 768px) 50vw, 25vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
          {product.isBestseller && (
            <span className="absolute left-3 top-3 rounded-full bg-accent px-3 py-1 text-xs font-medium text-white">
              Best seller
            </span>
          )}
        </div>
      </Link>
      <div className="space-y-2 p-4">
        {product.category && <p className="text-xs text-muted">{product.category.name}</p>}
        <Link href={`/product/${product.slug}`}>
          <h3 className="font-display text-base text-ink">{product.name}</h3>
        </Link>
        <p className="line-clamp-2 text-sm text-muted">{product.shortDescription}</p>
        {product.reviewCount > 0 && (
          <p className="text-xs text-muted">★ {product.rating.toFixed(1)} ({product.reviewCount} reviews)</p>
        )}
        <div className="flex items-baseline gap-2 pt-1">
          <span className="text-lg font-semibold text-ink">{formatINR(product.price)}</span>
          {product.discountPercent > 0 && (
            <>
              <span className="text-sm text-muted line-through">{formatINR(product.originalPrice)}</span>
              <span className="text-xs font-medium text-accent-2">{product.discountPercent}% OFF</span>
            </>
          )}
        </div>
        <div className="flex gap-2 pt-2">
          <Link
            href={`/product/${product.slug}`}
            className="flex-1 rounded-full border border-border py-2 text-center text-sm text-ink transition-colors hover:border-accent"
          >
            View Details
          </Link>
          <Link
            href={`/checkout?product=${product.slug}`}
            className="flex-1 rounded-full bg-accent py-2 text-center text-sm font-medium text-white transition-opacity hover:opacity-90"
          >
            Buy Now
          </Link>
        </div>
      </div>
    </div>
  );
}
