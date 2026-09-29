import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { createClient } from "@supabase/supabase-js";

function getSupabaseServerClient() {
  const url = process.env.SUPABASE_URL;
  const secretKey = process.env.SUPABASE_SECRET_KEY;

  if (!url || !secretKey) {
    throw new Error("Supabase is not configured.");
  }

  return createClient(url, secretKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

export async function POST(req: NextRequest) {
  const session = await getAdminSession();

  if (!session) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    const bucket = process.env.SUPABASE_IMAGE_BUCKET;

    if (!bucket) {
      return NextResponse.json(
        { error: "Image storage bucket is not configured." },
        { status: 503 }
      );
    }

    const formData = await req.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: "No image was provided." },
        { status: 400 }
      );
    }

    if (file.size === 0) {
      return NextResponse.json(
        { error: "The selected image is empty." },
        { status: 400 }
      );
    }

    // Maximum 10 MB
    const maxSize = 10 * 1024 * 1024;

    if (file.size > maxSize) {
      return NextResponse.json(
        { error: "Image is too large. Maximum size is 10 MB." },
        { status: 400 }
      );
    }

    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/gif",
    ];

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        {
          error:
            "Invalid image format. Please use JPG, PNG, WEBP or GIF.",
        },
        { status: 400 }
      );
    }

    const safeName = file.name
      .replace(/[^a-zA-Z0-9._-]/g, "_")
      .replace(/_+/g, "_");

    const uniqueName = `${Date.now()}-${crypto.randomUUID()}-${safeName}`;

    const storageKey = `products/${uniqueName}`;

    const supabase = getSupabaseServerClient();

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(storageKey, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error("Supabase image upload error:", uploadError);

      return NextResponse.json(
        {
          error: `Image upload failed: ${uploadError.message}`,
        },
        { status: 500 }
      );
    }

    const { data } = supabase.storage
      .from(bucket)
      .getPublicUrl(storageKey);

    return NextResponse.json({
      success: true,
      storageKey,
      fileName: file.name,
      fileSize: file.size,
      mimeType: file.type,
      url: data.publicUrl,
    });
  } catch (error) {
    console.error("Image upload error:", error);

    return NextResponse.json(
      {
        error: "Unable to upload image.",
      },
      { status: 500 }
    );
  }
}