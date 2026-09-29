import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { ProductEditForm } from "@/components/admin/ProductEditForm";

export const dynamic = "force-dynamic";

export default async function EditProductPage({
  params,
}: {
  params: { id: string };
}) {
  const product = await prisma.product.findUnique({
    where: {
      id: params.id,
    },
    include: {
      category: true,
      files: true,
    },
  });

  if (!product) {
    notFound();
  }

  const categories = await prisma.category.findMany({
    orderBy: {
      name: "asc",
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-ink">
          Edit Product
        </h1>

        <p className="mt-1 text-sm text-muted">
          Update your product information, pricing,
          thumbnail and digital files.
        </p>
      </div>

      <ProductEditForm
        product={{
          id: product.id,
          name: product.name,
          slug: product.slug,
          categoryId: product.categoryId,

          shortDescription: product.shortDescription,
          fullDescription: product.fullDescription,

          price: product.price,
          originalPrice: product.originalPrice,

          thumbnailUrl: product.thumbnailUrl,
          previewVideoUrl: product.previewVideoUrl,

          features: Array.isArray(product.features)
            ? product.features.map(String)
            : [],

          whatsIncluded: Array.isArray(product.whatsIncluded)
            ? product.whatsIncluded.map(String)
            : [],

          faqs: Array.isArray(product.faqs)
            ? product.faqs
            : [],

          tags: Array.isArray(product.tags)
            ? product.tags.map(String)
            : [],

          externalDeliveryUrl:
            product.externalDeliveryUrl,

          seoTitle: product.seoTitle,
          seoDescription:
            product.seoDescription,

          status: product.status,

          isFeatured: product.isFeatured,
          isBestseller: product.isBestseller,
          isLimitedOffer:
            product.isLimitedOffer,

          whatsappMessageTemplate:
            product.whatsappMessageTemplate,

          deliveryInstructions:
            product.deliveryInstructions,

          downloadLimit:
            product.downloadLimit,

          linkExpiryHours:
            product.linkExpiryHours,

          files: product.files.map((file) => ({
            id: file.id,
            storageKey: file.storageKey,
            fileName: file.fileName,
            fileSize: file.fileSize,
          })),
        }}
        categories={categories.map((category) => ({
          id: category.id,
          name: category.name,
        }))}
      />
    </div>
  );
}