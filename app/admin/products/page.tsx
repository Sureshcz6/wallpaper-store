import Link from "next/link";
import { prisma } from "@/lib/db";
import { ProductsTable } from "@/components/admin/ProductsTable";

export default async function AdminProductsPage() {
  const products = await prisma.product.findMany({
    orderBy: { createdAt: "desc" },
    include: { category: true, _count: { select: { orders: true } } }
  });

  const serialized = products.map((p) => ({ ...p, createdAt: p.createdAt.toISOString() }));

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-display text-2xl text-ink">Products</h1>
        <Link href="/admin/products/new" className="rounded-full bg-accent px-4 py-2 text-sm font-medium text-white">
          Add Product
        </Link>
      </div>
      <div className="rounded-card border border-border bg-surface p-4">
        <ProductsTable products={serialized as any} />
      </div>
    </div>
  );
}
