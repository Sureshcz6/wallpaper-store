import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { productSchema } from "@/lib/validation";
import { getAdminSession } from "@/lib/auth";
import { serializeProduct } from "@/lib/product-serializer";

export const dynamic = "force-dynamic";

/**
 * GET /api/products
 *
 * Public product listing.
 * Supports:
 * - search
 * - category
 * - sort
 * - pagination
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const search = searchParams.get("search")?.trim() || "";
    const category = searchParams.get("category")?.trim() || "";
    const sort = searchParams.get("sort") || "newest";

    const page = Math.max(
      1,
      Number.parseInt(searchParams.get("page") || "1", 10) || 1
    );

    const limit = Math.min(
      100,
      Math.max(
        1,
        Number.parseInt(searchParams.get("limit") || "20", 10) || 20
      )
    );

    const skip = (page - 1) * limit;

    const where: any = {
      status: "PUBLISHED",
    };

    if (search) {
      where.OR = [
        {
          name: {
            contains: search,
            mode: "insensitive",
          },
        },
        {
          shortDescription: {
            contains: search,
            mode: "insensitive",
          },
        },
        {
          fullDescription: {
            contains: search,
            mode: "insensitive",
          },
        },
      ];
    }

    if (category) {
      where.categoryId = category;
    }

    let orderBy: any = {
      createdAt: "desc",
    };

    switch (sort) {
      case "oldest":
        orderBy = {
          createdAt: "asc",
        };
        break;

      case "price-low":
        orderBy = {
          price: "asc",
        };
        break;

      case "price-high":
        orderBy = {
          price: "desc",
        };
        break;

      case "popular":
        orderBy = {
          isBestseller: "desc",
        };
        break;

      case "featured":
        orderBy = {
          isFeatured: "desc",
        };
        break;

      case "newest":
      default:
        orderBy = {
          createdAt: "desc",
        };
        break;
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          category: true,
          gallery: true,
          files: true,
        },
        orderBy,
        skip,
        take: limit,
      }),

      prisma.product.count({
        where,
      }),
    ]);

    return NextResponse.json({
      success: true,
      products: products.map(serializeProduct),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("GET /api/products error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch products",
      },
      {
        status: 500,
      }
    );
  }
}

/**
 * POST /api/products
 *
 * Admin-only product creation.
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getAdminSession();

    if (!session) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized",
        },
        {
          status: 401,
        }
      );
    }

    const body = await request.json();

    const parsed = productSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Validation failed",
          details: parsed.error.flatten(),
        },
        {
          status: 400,
        }
      );
    }

    const data = parsed.data;

    const existingProduct = await prisma.product.findUnique({
      where: {
        slug: data.slug,
      },
    });

    if (existingProduct) {
      return NextResponse.json(
        {
          success: false,
          error: "A product with this slug already exists",
        },
        {
          status: 409,
        }
      );
    }

    const product = await prisma.product.create({
      data: {
        name: data.name,
        slug: data.slug,

        categoryId: data.categoryId,

        shortDescription: data.shortDescription || "",
        fullDescription: data.fullDescription || "",

        price: data.price,
        originalPrice: data.originalPrice,

        thumbnailUrl: data.thumbnailUrl || "",
        previewVideoUrl: data.previewVideoUrl || null,

        features: data.features || [],
        whatsIncluded: data.whatsIncluded || [],
        faqs: data.faqs || [],
        tags: data.tags || [],

        externalDeliveryUrl: data.externalDeliveryUrl || null,

        seoTitle: data.seoTitle || null,
        seoDescription: data.seoDescription || null,

        status: data.status,

        isFeatured: data.isFeatured ?? false,
        isBestseller: data.isBestseller ?? false,
        isLimitedOffer: data.isLimitedOffer ?? false,

        whatsappMessageTemplate:
          data.whatsappMessageTemplate || null,

        deliveryInstructions:
          data.deliveryInstructions || null,

        downloadLimit:
          data.downloadLimit ?? null,

        linkExpiryHours:
          data.linkExpiryHours ?? null,
      },

      include: {
        category: true,
        gallery: true,
        files: true,
      },
    });

    return NextResponse.json(
      {
        success: true,
        product: serializeProduct(product),
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    console.error("POST /api/products error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to create product",
      },
      {
        status: 500,
      }
    );
  }
}