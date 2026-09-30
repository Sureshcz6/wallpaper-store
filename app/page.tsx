import Link from "next/link";
import { prisma } from "@/lib/db";
import { serializeProduct } from "@/lib/product-serializer";
import { Navbar } from "@/components/ui/Navbar";
import { Footer } from "@/components/ui/Footer";
import { ProductGrid } from "@/components/product/ProductGrid";

export const revalidate = 60;

export default async function HomePage() {
  const [featured, categories] = await Promise.all([
    prisma.product.findMany({
      where: { status: "PUBLISHED" },
      orderBy: { createdAt: "desc" },
      take: 8,
      include: {
        category: true,
        reviews: {
          where: { status: "APPROVED" },
        },
      },
    }),

    prisma.category.findMany({
      orderBy: { name: "asc" },
    }),
  ]);

  const products = featured.map(serializeProduct);
  const hasProducts = products.length > 0;

  return (
    <>
      <Navbar />

      <main>
        <section className="mx-auto max-w-6xl px-5 pb-16 pt-16 md:pt-24">
          <p className="text-sm text-accent-2">
            Instant access, no account needed
          </p>

          <h1 className="mt-3 max-w-2xl font-display text-4xl leading-tight text-ink md:text-6xl">
            Premium digital products, delivered the moment you pay.
          </h1>

          <p className="mt-4 max-w-lg text-muted">
            AI resource bundles, content packs, templates and more —
            browse, pay with Razorpay, and get your files right away.
          </p>

          <div className="mt-8 flex gap-4">
            <Link
              href="/products"
              className="rounded-full bg-accent px-6 py-3 text-sm font-medium text-white transition-opacity hover:opacity-90"
            >
              Explore Products
            </Link>

            <Link
              href="/products?sort=popular"
              className="rounded-full border border-border px-6 py-3 text-sm text-ink transition-colors hover:border-accent"
            >
              View Best Sellers
            </Link>
          </div>
        </section>

        {categories.length > 0 && (
          <section className="mx-auto max-w-6xl px-5 pb-10">
            <div className="flex flex-wrap gap-2">
              {categories.map((c) => (
                <Link
                  key={c.id}
                  href={`/products?category=${c.slug}`}
                  className="rounded-full border border-border px-4 py-1.5 text-sm text-muted transition-colors hover:border-accent hover:text-ink"
                >
                  {c.name}
                </Link>
              ))}
            </div>
          </section>
        )}

        <section className="mx-auto max-w-6xl px-5 pb-24">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="font-display text-2xl text-ink">
              Latest products
            </h2>

            <Link
              href="/products"
              className="text-sm text-muted transition-colors hover:text-ink"
            >
              View all
            </Link>
          </div>

          {hasProducts ? (
            <ProductGrid products={products} />
          ) : (
            <div className="rounded-card border border-border bg-surface p-12 text-center text-muted">
              No products available yet. Check back soon.
            </div>
          )}
        </section>
      </main>

      <Footer />
    </>
  );
}