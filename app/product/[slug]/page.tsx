import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { formatINR, computeDiscountPercent } from "@/lib/utils";
import { buildWaMeLink } from "@/lib/whatsapp";
import { Navbar } from "@/components/ui/Navbar";
import { Footer } from "@/components/ui/Footer";
import { ProductGrid } from "@/components/product/ProductGrid";
import { serializeProduct } from "@/lib/serialize-product";

export const revalidate = 30;

export default async function ProductDetailPage({ params }: { params: { slug: string } }) {
  const product = await prisma.product.findUnique({
    where: { slug: params.slug },
    include: {
      category: true,
      gallery: { orderBy: { sortOrder: "asc" } },
      reviews: { where: { status: "APPROVED" }, orderBy: { createdAt: "desc" } }
    }
  });

  if (!product || product.status !== "PUBLISHED") notFound();

  const discountPercent = computeDiscountPercent(product.originalPrice, product.price);
  const avgRating = product.reviews.length
    ? Math.round((product.reviews.reduce((s, r) => s + r.rating, 0) / product.reviews.length) * 10) / 10
    : 0;

  const features = Array.isArray(product.features) ? (product.features as string[]) : [];
  const whatsIncluded = Array.isArray(product.whatsIncluded) ? (product.whatsIncluded as string[]) : [];
  const faqs = Array.isArray(product.faqs) ? (product.faqs as { question: string; answer: string }[]) : [];

  const related = await prisma.product.findMany({
    where: { status: "PUBLISHED", categoryId: product.categoryId, NOT: { id: product.id } },
    take: 4,
    include: { category: true, reviews: { where: { status: "APPROVED" } } }
  });

  const whatsappLink = buildWaMeLink({ message: `Hello, I am interested in ${product.name}.` });

  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-6xl px-5 py-12">
        <div className="grid gap-10 md:grid-cols-2">
          <div>
            <div className="relative aspect-[4/3] overflow-hidden rounded-card border border-border bg-black/30">
              <Image src={product.thumbnailUrl} alt={product.name} fill className="object-cover" priority />
            </div>
            {product.gallery.length > 0 && (
              <div className="mt-3 grid grid-cols-4 gap-2">
                {product.gallery.map((g) => (
                  <div key={g.id} className="relative aspect-square overflow-hidden rounded-lg border border-border">
                    <Image src={g.url} alt="" fill className="object-cover" />
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            {product.category && <p className="text-sm text-accent-2">{product.category.name}</p>}
            <h1 className="mt-2 font-display text-3xl text-ink">{product.name}</h1>
            {product.reviews.length > 0 && (
              <p className="mt-2 text-sm text-muted">★ {avgRating} ({product.reviews.length} reviews)</p>
            )}
            <p className="mt-4 text-muted">{product.shortDescription}</p>

            <div className="mt-6 flex items-baseline gap-3">
              <span className="text-3xl font-semibold text-ink">{formatINR(product.price)}</span>
              {discountPercent > 0 && (
                <>
                  <span className="text-lg text-muted line-through">{formatINR(product.originalPrice)}</span>
                  <span className="rounded-full bg-accent-2/10 px-2 py-1 text-sm font-medium text-accent-2">
                    {discountPercent}% OFF
                  </span>
                </>
              )}
            </div>

            <Link
              href={`/checkout?product=${product.slug}`}
              className="mt-6 block w-full rounded-full bg-accent py-3 text-center text-base font-medium text-white transition-opacity hover:opacity-90"
            >
              Buy Now — {formatINR(product.price)}
            </Link>
            <p className="mt-3 text-xs text-muted">Secure Razorpay payment · Instant digital delivery</p>

            <a
              href={whatsappLink}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 flex items-center justify-center gap-2 rounded-full border border-border py-2.5 text-sm text-ink hover:border-accent-2 transition-colors"
            >
              Need help? Chat on WhatsApp
            </a>

            {whatsIncluded.length > 0 && (
              <div className="mt-8">
                <h2 className="font-display text-lg text-ink">What's included</h2>
                <ul className="mt-3 space-y-2 text-sm text-muted">
                  {whatsIncluded.map((item, i) => (
                    <li key={i} className="flex gap-2"><span className="text-accent-2">✓</span>{item}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        {product.fullDescription && (
          <section className="mt-16 max-w-3xl">
            <h2 className="font-display text-2xl text-ink">About this product</h2>
            <p className="mt-4 whitespace-pre-line text-muted">{product.fullDescription}</p>
          </section>
        )}

        {features.length > 0 && (
          <section className="mt-12">
            <h2 className="font-display text-2xl text-ink">Features</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {features.map((f, i) => (
                <div key={i} className="rounded-card border border-border bg-surface p-4 text-sm text-muted">{f}</div>
              ))}
            </div>
          </section>
        )}

        <section className="mt-12 rounded-card border border-border bg-surface p-6">
          <h2 className="font-display text-xl text-ink">How delivery works</h2>
          <p className="mt-2 text-sm text-muted">
            After your payment is verified, you'll be taken to a success page with a secure download link,
            and, where enabled, a WhatsApp confirmation message.
          </p>
        </section>

        <section className="mt-12">
          <h2 className="font-display text-2xl text-ink">Customer reviews</h2>
          {product.reviews.length === 0 ? (
            <p className="mt-4 text-muted">No reviews yet.</p>
          ) : (
            <div className="mt-4 space-y-4">
              {product.reviews.map((r) => (
                <div key={r.id} className="rounded-card border border-border bg-surface p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-ink">{r.name}</span>
                    <span className="text-sm text-accent-2">★ {r.rating}</span>
                  </div>
                  {r.verifiedPurchase && <p className="mt-1 text-xs text-muted">Verified purchase</p>}
                  <p className="mt-2 text-sm text-muted">{r.reviewText}</p>
                </div>
              ))}
            </div>
          )}
        </section>

        {faqs.length > 0 && (
          <section className="mt-12 max-w-3xl">
            <h2 className="font-display text-2xl text-ink">FAQ</h2>
            <div className="mt-4 space-y-3">
              {faqs.map((f, i) => (
                <details key={i} className="rounded-card border border-border bg-surface p-4">
                  <summary className="cursor-pointer text-sm font-medium text-ink">{f.question}</summary>
                  <p className="mt-2 text-sm text-muted">{f.answer}</p>
                </details>
              ))}
            </div>
          </section>
        )}

        {related.length > 0 && (
          <section className="mt-16">
            <h2 className="mb-6 font-display text-2xl text-ink">Related products</h2>
            <ProductGrid products={related.map(serializeProduct)} />
          </section>
        )}
      </main>

      {/* Sticky mobile CTA */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-bg/95 p-3 backdrop-blur md:hidden">
        <Link
          href={`/checkout?product=${product.slug}`}
          className="block w-full rounded-full bg-accent py-3 text-center text-sm font-medium text-white"
        >
          Buy Now — {formatINR(product.price)}
        </Link>
      </div>
      <Footer />
    </>
  );
}
