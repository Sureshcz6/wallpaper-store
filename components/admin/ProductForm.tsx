"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { slugify } from "@/lib/utils";

type Category = {
id: string;
name: string;
};

type UploadedFile = {
storageKey: string;
fileName: string;
fileSize: number;
};

export function ProductForm({
categories,
}: {
categories: Category[];
}) {
const router = useRouter();

const [name, setName] = useState("");
const [slug, setSlug] = useState("");

const [categoryId, setCategoryId] = useState(
categories[0]?.id ?? ""
);

const [shortDescription, setShortDescription] = useState("");
const [fullDescription, setFullDescription] = useState("");

const [price, setPrice] = useState("");
const [originalPrice, setOriginalPrice] = useState("");

// Thumbnail upload
const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
const [thumbnailUploading, setThumbnailUploading] = useState(false);
const [thumbnailError, setThumbnailError] = useState("");
const [thumbnailUrl, setThumbnailUrl] = useState("");

// Digital product file upload
const [selectedFile, setSelectedFile] = useState<File | null>(null);
const [uploadedFile, setUploadedFile] =
useState<UploadedFile | null>(null);
const [uploading, setUploading] = useState(false);

const [featuresText, setFeaturesText] = useState("");
const [whatsIncludedText, setWhatsIncludedText] = useState("");
const [tagsText, setTagsText] = useState("");

const [whatsappMessageTemplate, setWhatsappMessageTemplate] =
useState(
"Hello {{customer_name}}, thank you for purchasing {{product_name}}. Order ID: {{order_id}}. Your product: {{delivery_link}}"
);

const [deliveryInstructions, setDeliveryInstructions] =
useState("");

const [seoTitle, setSeoTitle] = useState("");
const [seoDescription, setSeoDescription] = useState("");

const [error, setError] = useState<string | null>(null);

const [loading, setLoading] = useState<
"idle" | "draft" | "publish"

> ("idle");

async function uploadFile() {
if (!selectedFile) {
setError("Please select a digital product file first.");
return;
}


setError(null);
setUploading(true);

try {
  const formData = new FormData();
  formData.append("file", selectedFile);

  const res = await fetch("/api/admin/upload", {
    method: "POST",
    body: formData,
  });

  const data = await res.json();

  if (!res.ok) {
    setError(data.error ?? "File upload failed.");
    return;
  }

  setUploadedFile({
    storageKey: data.storageKey,
    fileName: data.fileName,
    fileSize: data.fileSize,
  });
} catch {
  setError("Unable to upload the file.");
} finally {
  setUploading(false);
}

}

async function uploadThumbnail() {
if (!thumbnailFile) {
setThumbnailError("Please select an image first.");
return;
}


setThumbnailUploading(true);
setThumbnailError("");

try {
  const formData = new FormData();
  formData.append("file", thumbnailFile);

  const res = await fetch("/api/admin/upload-image", {
    method: "POST",
    body: formData,
  });

  const data = await res.json();

  if (!res.ok) {
    setThumbnailError(
      data.error ?? "Image upload failed."
    );
    return;
  }

  setThumbnailUrl(data.url);
} catch {
  setThumbnailError("Unable to upload thumbnail.");
} finally {
  setThumbnailUploading(false);
}


}

async function submit(
status: "DRAFT" | "PUBLISHED"
) {
setError(null);


if (!name.trim()) {
  setError("Product name is required.");
  return;
}

if (!categoryId) {
  setError("Please select a category.");
  return;
}

if (!price || Number(price) <= 0) {
  setError("Please enter a valid selling price.");
  return;
}

if (!thumbnailUrl) {
  setError("Please upload the product thumbnail first.");
  return;
}

if (!uploadedFile) {
  setError(
    "Please upload the digital product file first."
  );
  return;
}

setLoading(
  status === "PUBLISHED" ? "publish" : "draft"
);

const payload = {
  name,
  slug: slug || slugify(name),
  categoryId,
  shortDescription,
  fullDescription,

  price: Math.round(Number(price) * 100),

  originalPrice: originalPrice
    ? Math.round(Number(originalPrice) * 100)
    : undefined,

  thumbnailUrl,

  features: featuresText
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean),

  whatsIncluded: whatsIncludedText
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean),

  faqs: [],

  tags: tagsText
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean),

  whatsappMessageTemplate,
  deliveryInstructions,
  seoTitle,
  seoDescription,

  status,

  files: [uploadedFile],
};

try {
  const res = await fetch("/api/products", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const data = await res.json();

  if (!res.ok) {
    setError(
      data.error ??
        "Something went wrong. Please try again."
    );
    setLoading("idle");
    return;
  }

  router.push("/admin/products");
  router.refresh();
} catch {
  setError("Unable to create the product.");
  setLoading("idle");
}


}

const inputClass =
"w-full rounded-lg border border-border bg-bg px-4 py-2.5 text-sm text-ink focus-ring";

const labelClass =
"mb-1 block text-sm text-muted";

return ( <div className="max-w-2xl space-y-8">


  {/* BASIC INFO */}
  <section className="space-y-4">
    <h2 className="font-display text-lg text-ink">
      Basic info
    </h2>

    <div>
      <label className={labelClass}>
        Product name
      </label>

      <input
        className={inputClass}
        value={name}
        onChange={(e) =>
          setName(e.target.value)
        }
      />
    </div>

    <div>
      <label className={labelClass}>
        Slug
      </label>

      <input
        className={inputClass}
        value={slug}
        onChange={(e) =>
          setSlug(e.target.value)
        }
        placeholder={slugify(name)}
      />
    </div>

    <div>
      <label className={labelClass}>
        Category
      </label>

      <select
        className={inputClass}
        value={categoryId}
        onChange={(e) =>
          setCategoryId(e.target.value)
        }
      >
        {categories.map((c) => (
          <option
            key={c.id}
            value={c.id}
          >
            {c.name}
          </option>
        ))}
      </select>
    </div>

    <div>
      <label className={labelClass}>
        Short description
      </label>

      <input
        className={inputClass}
        value={shortDescription}
        onChange={(e) =>
          setShortDescription(e.target.value)
        }
      />
    </div>

    <div>
      <label className={labelClass}>
        Full description
      </label>

      <textarea
        className={inputClass}
        rows={5}
        value={fullDescription}
        onChange={(e) =>
          setFullDescription(e.target.value)
        }
      />
    </div>
  </section>

  {/* PRICING */}
  <section className="space-y-4">
    <h2 className="font-display text-lg text-ink">
      Pricing
    </h2>

    <div className="grid grid-cols-2 gap-4">
      <div>
        <label className={labelClass}>
          Selling price (₹)
        </label>

        <input
          type="number"
          min="0"
          className={inputClass}
          value={price}
          onChange={(e) =>
            setPrice(e.target.value)
          }
        />
      </div>

      <div>
        <label className={labelClass}>
          Original price (₹)
        </label>

        <input
          type="number"
          min="0"
          className={inputClass}
          value={originalPrice}
          onChange={(e) =>
            setOriginalPrice(e.target.value)
          }
        />
      </div>
    </div>
  </section>

  {/* DIGITAL PRODUCT FILE */}
  <section className="space-y-4">
    <h2 className="font-display text-lg text-ink">
      Digital Product File
    </h2>

    <div>
      <label className={labelClass}>
        Select file to deliver after payment
      </label>

      <input
        type="file"
        className={inputClass}
        onChange={(e) => {
          setSelectedFile(
            e.target.files?.[0] ?? null
          );
          setUploadedFile(null);
        }}
      />
    </div>

    {selectedFile && !uploadedFile && (
      <div className="rounded-lg border border-border p-4 text-sm">
        <p className="text-ink">
          Selected:{" "}
          <strong>
            {selectedFile.name}
          </strong>
        </p>

        <p className="mt-1 text-muted">
          {(
            selectedFile.size /
            1024 /
            1024
          ).toFixed(2)}{" "}
          MB
        </p>

        <button
          type="button"
          onClick={uploadFile}
          disabled={uploading}
          className="mt-3 rounded-full bg-accent px-5 py-2.5 text-sm font-medium text-white disabled:opacity-60"
        >
          {uploading
            ? "Uploading..."
            : "Upload File"}
        </button>
      </div>
    )}

    {uploadedFile && (
      <div className="rounded-lg border border-green-500/40 p-4 text-sm">
        <p className="text-ink">
          File uploaded:{" "}
          <strong>
            {uploadedFile.fileName}
          </strong>
        </p>

        <p className="mt-1 text-muted">
          {(
            uploadedFile.fileSize /
            1024 /
            1024
          ).toFixed(2)}{" "}
          MB
        </p>

        <p className="mt-2 text-green-500">
          Upload successful
        </p>
      </div>
    )}
  </section>

  {/* MEDIA / THUMBNAIL */}
  <section className="space-y-4">
    <h2 className="font-display text-lg text-ink">
      Media
    </h2>

    <div>
      <label className={labelClass}>
        Product Thumbnail
      </label>

      <input
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className={inputClass}
        onChange={(e) => {
          setThumbnailFile(
            e.target.files?.[0] ?? null
          );
          setThumbnailError("");
        }}
      />

      {thumbnailFile && (
        <div className="mt-3 rounded-lg border border-border p-4">
          <p className="text-sm text-ink">
            Selected:{" "}
            <strong>
              {thumbnailFile.name}
            </strong>
          </p>

          <p className="mt-1 text-sm text-muted">
            {(
              thumbnailFile.size /
              1024 /
              1024
            ).toFixed(2)}{" "}
            MB
          </p>

          <button
            type="button"
            onClick={uploadThumbnail}
            disabled={thumbnailUploading}
            className="mt-3 rounded-full bg-accent px-5 py-2.5 text-sm font-medium text-white disabled:opacity-60"
          >
            {thumbnailUploading
              ? "Uploading..."
              : "Upload Thumbnail"}
          </button>
        </div>
      )}

      {thumbnailError && (
        <p className="mt-2 text-sm text-red-400">
          {thumbnailError}
        </p>
      )}

      {thumbnailUrl && (
        <div className="mt-4">
          <p className="mb-2 text-sm text-green-500">
            Thumbnail uploaded successfully
          </p>

          <img
            src={thumbnailUrl}
            alt="Product thumbnail preview"
            className="h-40 w-full rounded-lg object-cover"
          />
        </div>
      )}
    </div>
  </section>

  {/* FEATURES */}
  <section className="space-y-4">
    <h2 className="font-display text-lg text-ink">
      Features & contents
    </h2>

    <div>
      <label className={labelClass}>
        Features (one per line)
      </label>

      <textarea
        className={inputClass}
        rows={3}
        value={featuresText}
        onChange={(e) =>
          setFeaturesText(e.target.value)
        }
      />
    </div>

    <div>
      <label className={labelClass}>
        What's included (one per line)
      </label>

      <textarea
        className={inputClass}
        rows={3}
        value={whatsIncludedText}
        onChange={(e) =>
          setWhatsIncludedText(e.target.value)
        }
      />
    </div>

    <div>
      <label className={labelClass}>
        Tags (comma separated)
      </label>

      <input
        className={inputClass}
        value={tagsText}
        onChange={(e) =>
          setTagsText(e.target.value)
        }
      />
    </div>
  </section>

  {/* DELIVERY */}
  <section className="space-y-4">
    <h2 className="font-display text-lg text-ink">
      Delivery & WhatsApp
    </h2>

    <div>
      <label className={labelClass}>
        Delivery instructions
      </label>

      <textarea
        className={inputClass}
        rows={2}
        value={deliveryInstructions}
        onChange={(e) =>
          setDeliveryInstructions(
            e.target.value
          )
        }
      />
    </div>

    <div>
      <label className={labelClass}>
        WhatsApp message template
      </label>

      <textarea
        className={inputClass}
        rows={3}
        value={whatsappMessageTemplate}
        onChange={(e) =>
          setWhatsappMessageTemplate(
            e.target.value
          )
        }
      />
    </div>
  </section>

  {/* SEO */}
  <section className="space-y-4">
    <h2 className="font-display text-lg text-ink">
      SEO
    </h2>

    <div>
      <label className={labelClass}>
        SEO title
      </label>

      <input
        className={inputClass}
        value={seoTitle}
        onChange={(e) =>
          setSeoTitle(e.target.value)
        }
      />
    </div>

    <div>
      <label className={labelClass}>
        SEO description
      </label>

      <input
        className={inputClass}
        value={seoDescription}
        onChange={(e) =>
          setSeoDescription(e.target.value)
        }
      />
    </div>
  </section>

  {/* ERROR */}
  {error && (
    <p className="text-sm text-red-400">
      {error}
    </p>
  )}

  {/* ACTIONS */}
  <div className="flex gap-3 pb-8">
    <button
      type="button"
      onClick={() => submit("DRAFT")}
      disabled={
        loading !== "idle" ||
        uploading ||
        thumbnailUploading
      }
      className="rounded-full border border-border px-5 py-2.5 text-sm text-ink hover:border-accent transition-colors disabled:opacity-60"
    >
      {loading === "draft"
        ? "Saving..."
        : "Save Draft"}
    </button>

    <button
      type="button"
      onClick={() => submit("PUBLISHED")}
      disabled={
        loading !== "idle" ||
        uploading ||
        thumbnailUploading
      }
      className="rounded-full bg-accent px-5 py-2.5 text-sm font-medium text-white disabled:opacity-60"
    >
      {loading === "publish"
        ? "Publishing..."
        : "Publish Product"}
    </button>
  </div>
</div>


);
}
