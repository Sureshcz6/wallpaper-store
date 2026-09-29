import { prisma } from "@/lib/db";
import { CategoryManager } from "@/components/admin/CategoryManager";

export default async function AdminCategoriesPage() {
  const categories = await prisma.category.findMany({ orderBy: { name: "asc" } });
  return (
    <div>
      <h1 className="mb-6 font-display text-2xl text-ink">Categories</h1>
      <CategoryManager categories={categories} />
    </div>
  );
}
