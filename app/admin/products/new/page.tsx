import { prisma } from "@/lib/db";
import { ProductForm } from "@/components/admin/ProductForm";

export default async function NewProductPage() {
  const categories = await prisma.category.findMany({ orderBy: { name: "asc" } });

  return (
    <div>
      <h1 className="mb-6 font-display text-2xl text-ink">Add product</h1>
      {categories.length === 0 ? (
        <p className="text-muted">Create a category first under Admin → Categories.</p>
      ) : (
        <ProductForm categories={categories} />
      )}
    </div>
  );
}
