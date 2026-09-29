import { prisma } from "@/lib/db";
import { serializeProduct } from "@/lib/serialize-product";
import { Navbar } from "@/components/ui/Navbar";
import { Footer } from "@/components/ui/Footer";
import { ProductGrid } from "@/components/product/ProductGrid";

export const revalidate = 30;

export default async function ProductsPage({
  searchParams
}: {
  searchParams: { q?: string; category?: string; sort?: string };
}) {
  const { q, category, sort } = searchParams;

  const where: any = { status: "PUBLISHED" };
  if (category) where.category = { slug: category };
  if (q) {
    where.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { shortDescription: { contains: q, mode: "insensitive" } }
    ];
  }

  const orderBy =
    sort === "price_low" ? { price: "asc" as const }
    : sort === "price_high" ? { price: "desc" as const }
    : { createdAt: "desc" as const };

  const [items, categories] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy,
      include: { category: true, reviews: { where: { status: "APPROVED" } } }
    }),
    prisma.category.findMany({ orderBy: { name: "asc" } })
  ]);

  const products = items.map(serializeProduct);

  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-6xl px-5 py-12">
        <h1 className="mb-6 font-display text-3xl text-ink">All products</h1>

        <form className="mb-6 flex flex-wrap gap-3" action="/products">
          <input
            type="search"
            name="q"
            defaultValue={q}
            placeholder="Search products..."
            className="flex-1 min-w-[200px] rounded-full border border-border bg-surface px-4 py-2 text-sm text-ink placeholder:text-muted focus-ring"
          />
          <select
            name="category"
            defaultValue={category ?? ""}
            className="rounded-full border border-border bg-surface px-4 py-2 text-sm text-ink focus-ring"
          >
            <option value="">All categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.slug}>{c.name}</option>
            ))}
          </select>
          <select
            name="sort"
            defaultValue={sort ?? "newest"}
            className="rounded-full border border-border bg-surface px-4 py-2 text-sm text-ink focus-ring"
          >
            <option value="newest">Newest</option>
            <option value="price_low">Price: Low to High</option>
            <option value="price_high">Price: High to Low</option>
          </select>
          <button type="submit" className="rounded-full bg-accent px-5 py-2 text-sm font-medium text-white">
            Apply
          </button>
        </form>

        <ProductGrid products={products} />
      </main>
      <Footer />
    </>
  );
}
