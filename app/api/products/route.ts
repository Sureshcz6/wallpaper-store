import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { productSchema } from "@/lib/validation";
import { getAdminSession } from "@/lib/auth";
import { computeDiscountPercent } from "@/lib/utils";

/** Public product listing: search, category filter, sort, pagination. Only PUBLISHED products. */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  const q = searchParams.get("q")?.trim();
  const category = searchParams.get("category");
  const sort = searchParams.get("sort") ?? "newest";

  const page = Math.max(
    1,
    Number(searchParams.get("page") ?? "1")
  );

  const pageSize = 24;

  const where: any = {
    status: "PUBLISHED",
  };

  if (category) {
    where.category = {
      slug: category,
    };
  }

  if (q) {
    where.OR = [
      {
        name: {
          contains: q,
          mode: "insensitive",
        },
      },
      {
        shortDescription: {
          contains: q,
          mode: "insensitive",
        },
      },
      {
        tags: {
          array_contains: q,
        },
      },
    ];
  }

  const orderBy =
    sort === "price_low"
      ? { price: "asc" as const }
      : sort === "price_high"
        ? { price: "desc" as const }
        : sort === "popular"
          ? {
              orders: {
                _count: "desc" as const,
              },
            }
          : {
              createdAt: "desc" as const,
            };

  const [items, total] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy: orderBy as any,
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        category: true,
        reviews: {
          where: {
            status: "APPROVED",
          },
        },
      },
    }),

    prisma.product.count({
      where,
    }),
  ]);

  const products = items.map(serializeProduct);

  return NextResponse.json({
    products,
    total,
    page,
    pageSize,
  });
}

/** Admin: create a product with digital files. */
export async function POST(req: NextRequest) {
  const session = await getAdminSession();

  if (!session) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  const body = await req.json().catch(() => null);

  const parsed = productSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Invalid product data.",
        issues: parsed.error.flatten(),
      },
      { status: 400 }
    );
  }

  const data = parsed.data;

  const existingSlug = await prisma.product.findUnique({
    where: {
      slug: data.slug,
    },
  });

  if (existingSlug) {
    return NextResponse.json(
      {
        error: "A product with this slug already exists.",
      },
      { status: 409 }
    );
  }

  // Uploaded files received from Supabase Storage
  const files = Array.isArray(body?.files)
    ? body.files
    : [];

  if (files.length === 0) {
    return NextResponse.json(
      {
        error:
          "Please upload at least one digital product file first.",
      },
      { status: 400 }
    );
  }

  const validFiles = files.filter(
    (file: any) =>
      file &&
      typeof file.storageKey === "string" &&
      file.storageKey.trim() &&
      typeof file.fileName === "string" &&
      file.fileName.trim() &&
      Number.isInteger(file.fileSize) &&
      file.fileSize > 0
  );

  if (validFiles.length === 0) {
    return NextResponse.json(
      {
        error: "Uploaded file information is invalid.",
      },
      { status: 400 }
    );
  }

  const product = await prisma.product.create({
    data: {
      name: data.name,
      slug: data.slug,
      categoryId: data.categoryId,

      shortDescription: data.shortDescription,
      fullDescription: data.fullDescription,

      price: data.price,
      originalPrice: data.originalPrice,

      thumbnailUrl: data.thumbnailUrl,
      previewVideoUrl:
        data.previewVideoUrl || null,

      features: data.features,
      whatsIncluded: data.whatsIncluded,
      faqs: data.faqs,
      tags: data.tags,

      externalDeliveryUrl:
        data.externalDeliveryUrl || null,

      seoTitle: data.seoTitle,
      seoDescription: data.seoDescription,

      status: data.status,

      isFeatured: data.isFeatured,
      isBestseller: data.isBestseller,
      isLimitedOffer: data.isLimitedOffer,

      whatsappMessageTemplate:
        data.whatsappMessageTemplate,

      deliveryInstructions:
        data.deliveryInstructions,

      downloadLimit:
        data.downloadLimit ?? null,

      linkExpiryHours:
        data.linkExpiryHours ?? null,

      // Save uploaded files in ProductFile
      files: {
        create: validFiles.map((file: any) => ({
          storageKey: file.storageKey,
          fileName: file.fileName,
          fileSize: file.fileSize,
        })),
      },
    },

    include: {
      files: true,
    },
  });

  return NextResponse.json({
    product,
  });
}

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