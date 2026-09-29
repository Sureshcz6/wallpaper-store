import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { productSchema } from "@/lib/validation";
import { getAdminSession } from "@/lib/auth";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const product = await prisma.product.findUnique({
      where: { id: params.id },
      include: {
        category: true,
        gallery: {
          orderBy: {
            sortOrder: "asc",
          },
        },
        files: true,
      },
    });

    if (!product) {
      return NextResponse.json(
        { error: "Product not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({ product });
  } catch (error) {
    console.error("Get product error:", error);

    return NextResponse.json(
      { error: "Unable to load product." },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getAdminSession();

  if (!session) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    const body = await req.json().catch(() => null);

    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { error: "Invalid request data." },
        { status: 400 }
      );
    }

    /*
     * files relation ko productSchema se alag handle karte hain.
     * Prisma ProductFile[] direct product update ke data me nahi ja sakta.
     */
    const files = Array.isArray(body.files) ? body.files : undefined;

    const productData = { ...body };

    delete productData.files;

    const parsed = productSchema.partial().safeParse(productData);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Invalid product data.",
          issues: parsed.error.flatten(),
        },
        { status: 400 }
      );
    }

    const product = await prisma.$transaction(async (tx) => {
      /*
       * Pehle normal Product fields update karo.
       */
      const updatedProduct = await tx.product.update({
        where: {
          id: params.id,
        },
        data: parsed.data as any,
      });

      /*
       * Agar files array request me aayi hai,
       * existing ProductFile records replace karo.
       */
      if (files !== undefined) {
        await tx.productFile.deleteMany({
          where: {
            productId: params.id,
          },
        });

        if (files.length > 0) {
          await tx.productFile.createMany({
            data: files.map((file: any) => ({
              productId: params.id,
              storageKey: String(file.storageKey),
              fileName: String(file.fileName),
              fileSize: Number(file.fileSize),
            })),
          });
        }
      }

      return tx.product.findUnique({
        where: {
          id: params.id,
        },
        include: {
          category: true,
          gallery: {
            orderBy: {
              sortOrder: "asc",
            },
          },
          files: true,
        },
      });
    });

    return NextResponse.json({
      success: true,
      product,
    });
  } catch (error) {
    console.error("Update product error:", error);

    return NextResponse.json(
      {
        error: "Unable to update product.",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getAdminSession();

  if (!session) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    await prisma.product.delete({
      where: {
        id: params.id,
      },
    });

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error("Delete product error:", error);

    return NextResponse.json(
      {
        error: "Unable to delete product.",
      },
      { status: 500 }
    );
  }
}