"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Category = {
  id: string;
  name: string;
};

type ProductFile = {
  id: string;
  storageKey: string;
  fileName: string;
  fileSize: number;
};

type Product = {
  id: string;
  name: string;
  slug: string;
  categoryId: string;

  shortDescription: string;
  fullDescription: string;

  price: number;
  originalPrice: number | null;

  thumbnailUrl: string | null;
  previewVideoUrl: string | null;

  features: string[];
  whatsIncluded: string[];
  faqs: any[];
  tags: string[];

  externalDeliveryUrl: string | null;

  seoTitle: string | null;
  seoDescription: string | null;

  status: "DRAFT" | "PUBLISHED" | "UNPUBLISHED";

  isFeatured: boolean;
  isBestseller: boolean;
  isLimitedOffer: boolean;

  whatsappMessageTemplate: string | null;
  deliveryInstructions: string | null;

  downloadLimit: number | null;
  linkExpiryHours: number | null;

  files: ProductFile[];
};

type UploadedFile = {
  storageKey: string;
  fileName: string;
  fileSize: number;
};

export function ProductEditForm({
  product,
  categories,
}: {
  product: Product;
  categories: Category[];
}) {
  const router = useRouter();

  const [name, setName] = useState(product.name);
  const [slug, setSlug] = useState(product.slug);
  const [categoryId, setCategoryId] = useState(product.categoryId);

  const [shortDescription, setShortDescription] = useState(
    product.shortDescription ?? ""
  );

  const [fullDescription, setFullDescription] = useState(
    product.fullDescription ?? ""
  );

  const [price, setPrice] = useState(
    String((product.price ?? 0) / 100)
  );

  const [originalPrice, setOriginalPrice] = useState(
    product.originalPrice
      ? String(product.originalPrice / 100)
      : ""
  );

  const [thumbnailUrl, setThumbnailUrl] = useState(
    product.thumbnailUrl ?? ""
  );

  const [thumbnailUploading, setThumbnailUploading] = useState(false);

  const [previewVideoUrl, setPreviewVideoUrl] = useState(
    product.previewVideoUrl ?? ""
  );

  const [featuresText, setFeaturesText] = useState(
    (product.features ?? []).join("\n")
  );

  const [whatsIncludedText, setWhatsIncludedText] = useState(
    (product.whatsIncluded ?? []).join("\n")
  );

  const [tagsText, setTagsText] = useState(
    (product.tags ?? []).join(", ")
  );

  const [externalDeliveryUrl, setExternalDeliveryUrl] =
    useState(product.externalDeliveryUrl ?? "");

  const [seoTitle, setSeoTitle] = useState(
    product.seoTitle ?? ""
  );

  const [seoDescription, setSeoDescription] = useState(
    product.seoDescription ?? ""
  );

  const [status, setStatus] = useState(product.status);

  const [isFeatured, setIsFeatured] = useState(
    product.isFeatured
  );

  const [isBestseller, setIsBestseller] = useState(
    product.isBestseller
  );

  const [isLimitedOffer, setIsLimitedOffer] = useState(
    product.isLimitedOffer
  );

  const [whatsappMessageTemplate, setWhatsappMessageTemplate] =
    useState(
      product.whatsappMessageTemplate ?? ""
    );

  const [deliveryInstructions, setDeliveryInstructions] =
    useState(product.deliveryInstructions ?? "");

  const [downloadLimit, setDownloadLimit] = useState(
    product.downloadLimit
      ? String(product.downloadLimit)
      : ""
  );

  const [linkExpiryHours, setLinkExpiryHours] = useState(
    product.linkExpiryHours
      ? String(product.linkExpiryHours)
      : ""
  );

  const [selectedFile, setSelectedFile] =
    useState<File | null>(null);

  const [uploadedFile, setUploadedFile] =
    useState<UploadedFile | null>(null);

  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function uploadThumbnail(file: File) {
    setError(null);
    setSuccess(null);
    setThumbnailUploading(true);

    try {
      if (file.size === 0) {
        throw new Error("The selected image is empty.");
      }

      if (file.size > 10 * 1024 * 1024) {
        throw new Error(
          "Image is too large. Maximum size is 10 MB."
        );
      }

      const allowedTypes = [
        "image/jpeg",
        "image/png",
        "image/webp",
        "image/gif",
      ];

      if (!allowedTypes.includes(file.type)) {
        throw new Error(
          "Invalid image format. Please use JPG, PNG, WEBP or GIF."
        );
      }

      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/admin/upload-image", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(
          data.error ?? "Thumbnail upload failed."
        );
      }

      if (!data.url) {
        throw new Error(
          "Thumbnail uploaded but no image URL was returned."
        );
      }

      setThumbnailUrl(data.url);
      setSuccess("Thumbnail uploaded successfully.");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Thumbnail upload failed."
      );
    } finally {
      setThumbnailUploading(false);
    }
  }

  async function uploadFile() {
    if (!selectedFile) {
      setError("Please select a file first.");
      return;
    }

    setError(null);
    setSuccess(null);
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
        throw new Error(
          data.error ?? "File upload failed."
        );
      }

      setUploadedFile({
        storageKey: data.storageKey,
        fileName: data.fileName,
        fileSize: data.fileSize,
      });

      setSuccess("File uploaded successfully.");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "File upload failed."
      );
    } finally {
      setUploading(false);
    }
  }

  async function saveChanges() {
    setError(null);
    setSuccess(null);
    setSaving(true);

    try {
      if (!thumbnailUrl) {
        throw new Error(
          "Please upload a thumbnail image first."
        );
      }

      if (!name.trim()) {
        throw new Error("Product name is required.");
      }

      if (!slug.trim()) {
        throw new Error("Product slug is required.");
      }

      if (!categoryId) {
        throw new Error("Please select a category.");
      }

      if (!price || Number(price) <= 0) {
        throw new Error("Please enter a valid selling price.");
      }

      if (
        originalPrice &&
        Number(originalPrice) <= 0
      ) {
        throw new Error(
          "Please enter a valid original price."
        );
      }

      const files = uploadedFile
        ? [
            ...product.files.map((file) => ({
              storageKey: file.storageKey,
              fileName: file.fileName,
              fileSize: file.fileSize,
            })),
            uploadedFile,
          ]
        : product.files.map((file) => ({
            storageKey: file.storageKey,
            fileName: file.fileName,
            fileSize: file.fileSize,
          }));

      const payload = {
        name: name.trim(),
        slug: slug.trim(),
        categoryId,

        shortDescription,
        fullDescription,

        price: Math.round(Number(price) * 100),

        originalPrice: originalPrice
          ? Math.round(Number(originalPrice) * 100)
          : undefined,

        thumbnailUrl,
        previewVideoUrl: previewVideoUrl || undefined,

        features: featuresText
          .split("\n")
          .map((item) => item.trim())
          .filter(Boolean),

        whatsIncluded: whatsIncludedText
          .split("\n")
          .map((item) => item.trim())
          .filter(Boolean),

        faqs: product.faqs ?? [],

        tags: tagsText
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),

        externalDeliveryUrl:
          externalDeliveryUrl || undefined,

        seoTitle: seoTitle || undefined,
        seoDescription: seoDescription || undefined,

        status,

        isFeatured,
        isBestseller,
        isLimitedOffer,

        whatsappMessageTemplate:
          whatsappMessageTemplate || undefined,

        deliveryInstructions:
          deliveryInstructions || undefined,

        downloadLimit: downloadLimit
          ? Number(downloadLimit)
          : null,

        linkExpiryHours: linkExpiryHours
          ? Number(linkExpiryHours)
          : null,

        files,
      };

      const res = await fetch(
        `/api/products/${product.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(
          data.error ?? "Unable to update product."
        );
      }

      setSuccess(
        "Product updated successfully."
      );

      router.refresh();

      setTimeout(() => {
        router.push("/admin/products");
        router.refresh();
      }, 800);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to update product."
      );
    } finally {
      setSaving(false);
    }
  }

  const inputClass =
    "w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-400";

  const labelClass =
    "mb-1.5 block text-sm font-medium text-slate-900";

  return (
    <div className="max-w-4xl space-y-8">

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {success && (
        <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          {success}
        </div>
      )}

      {/* BASIC INFORMATION */}

      <div className="space-y-6 rounded-xl border border-slate-200 bg-white p-6">

        <h2 className="text-lg font-semibold text-slate-900">
          Basic Information
        </h2>

        <div>
          <label className={labelClass}>
            Product Name
          </label>

          <input
            className={inputClass}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <div>
          <label className={labelClass}>
            Slug
          </label>

          <input
            className={inputClass}
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
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
            {categories.map((category) => (
              <option
                key={category.id}
                value={category.id}
              >
                {category.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className={labelClass}>
            Short Description
          </label>

          <textarea
            className={inputClass}
            rows={3}
            value={shortDescription}
            onChange={(e) =>
              setShortDescription(e.target.value)
            }
          />
        </div>

        <div>
          <label className={labelClass}>
            Full Description
          </label>

          <textarea
            className={inputClass}
            rows={7}
            value={fullDescription}
            onChange={(e) =>
              setFullDescription(e.target.value)
            }
          />
        </div>
      </div>

      {/* PRICING */}

      <div className="space-y-6 rounded-xl border border-slate-200 bg-white p-6">

        <h2 className="text-lg font-semibold text-slate-900">
          Pricing
        </h2>

        <div className="grid gap-5 md:grid-cols-2">

          <div>
            <label className={labelClass}>
              Price (₹)
            </label>

            <input
              type="number"
              min="0"
              step="0.01"
              className={inputClass}
              value={price}
              onChange={(e) =>
                setPrice(e.target.value)
              }
            />
          </div>

          <div>
            <label className={labelClass}>
              Original Price (₹)
            </label>

            <input
              type="number"
              min="0"
              step="0.01"
              className={inputClass}
              value={originalPrice}
              onChange={(e) =>
                setOriginalPrice(e.target.value)
              }
            />
          </div>

        </div>
      </div>

      {/* IMAGES & MEDIA */}

      <div className="space-y-6 rounded-xl border border-slate-200 bg-white p-6">

        <h2 className="text-lg font-semibold text-slate-900">
          Images & Media
        </h2>

        <div>
          <label className={labelClass}>
            Thumbnail Image
          </label>

          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="block w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900"
            disabled={thumbnailUploading}
            onChange={(e) => {
              const file = e.target.files?.[0];

              if (file) {
                uploadThumbnail(file);
              }
            }}
          />

          <p className="mt-2 text-xs text-slate-500">
            JPG, PNG, WEBP or GIF. Maximum 10 MB.
          </p>

          {thumbnailUploading && (
            <p className="mt-3 text-sm font-medium text-slate-700">
              Uploading thumbnail...
            </p>
          )}

          {thumbnailUrl && (
            <div className="mt-4">

              <p className="mb-2 text-xs font-medium text-slate-600">
                Current thumbnail preview
              </p>

              <img
                src={thumbnailUrl}
                alt={name}
                className="h-40 w-40 rounded-lg border border-slate-300 object-cover"
              />

            </div>
          )}
        </div>

        <div>
          <label className={labelClass}>
            Preview Video URL
          </label>

          <input
            className={inputClass}
            value={previewVideoUrl}
            onChange={(e) =>
              setPreviewVideoUrl(e.target.value)
            }
            placeholder="https://..."
          />
        </div>

      </div>

      {/* DIGITAL PRODUCT FILE */}

      <div className="space-y-6 rounded-xl border border-slate-200 bg-white p-6">

        <h2 className="text-lg font-semibold text-slate-900">
          Digital Product File
        </h2>

        {product.files.length > 0 && (
          <div className="space-y-2">

            <p className="text-sm font-medium text-slate-900">
              Existing files
            </p>

            {product.files.map((file) => (
              <div
                key={file.id}
                className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3"
              >
                <div className="text-sm font-medium text-slate-900">
                  {file.fileName}
                </div>

                <div className="mt-1 text-xs text-slate-500">
                  {(file.fileSize / 1024 / 1024).toFixed(2)}{" "}
                  MB
                </div>
              </div>
            ))}

          </div>
        )}

        <div>
          <label className={labelClass}>
            Replace / Add Digital File
          </label>

          <input
            type="file"
            className="block w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900"
            onChange={(e) =>
              setSelectedFile(
                e.target.files?.[0] ?? null
              )
            }
          />
        </div>

        {selectedFile && (
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">

            <p className="text-sm font-medium text-slate-900">
              Selected file
            </p>

            <p className="mt-1 text-sm text-slate-600">
              {selectedFile.name}
            </p>

            <p className="text-xs text-slate-500">
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
              className="mt-3 rounded-lg bg-black px-4 py-2 text-sm text-white disabled:opacity-50"
            >
              {uploading
                ? "Uploading..."
                : "Upload File"}
            </button>

          </div>
        )}

        {uploadedFile && (
          <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-700">

            New file uploaded:

            <div className="mt-1 font-medium">
              {uploadedFile.fileName}
            </div>

          </div>
        )}

      </div>

      {/* FEATURES */}

      <div className="space-y-6 rounded-xl border border-slate-200 bg-white p-6">

        <h2 className="text-lg font-semibold text-slate-900">
          Features & Contents
        </h2>

        <div>
          <label className={labelClass}>
            Features
          </label>

          <textarea
            className={inputClass}
            rows={6}
            value={featuresText}
            onChange={(e) =>
              setFeaturesText(e.target.value)
            }
            placeholder="One feature per line"
          />
        </div>

        <div>
          <label className={labelClass}>
            What's Included
          </label>

          <textarea
            className={inputClass}
            rows={6}
            value={whatsIncludedText}
            onChange={(e) =>
              setWhatsIncludedText(e.target.value)
            }
            placeholder="One item per line"
          />
        </div>

        <div>
          <label className={labelClass}>
            Tags
          </label>

          <input
            className={inputClass}
            value={tagsText}
            onChange={(e) =>
              setTagsText(e.target.value)
            }
            placeholder="recipe, cooking, ebook"
          />
        </div>

      </div>

      {/* DELIVERY */}

      <div className="space-y-6 rounded-xl border border-slate-200 bg-white p-6">

        <h2 className="text-lg font-semibold text-slate-900">
          Delivery
        </h2>

        <div>
          <label className={labelClass}>
            External Delivery URL
          </label>

          <input
            className={inputClass}
            value={externalDeliveryUrl}
            onChange={(e) =>
              setExternalDeliveryUrl(e.target.value)
            }
          />
        </div>

        <div>
          <label className={labelClass}>
            Delivery Instructions
          </label>

          <textarea
            className={inputClass}
            rows={4}
            value={deliveryInstructions}
            onChange={(e) =>
              setDeliveryInstructions(
                e.target.value
              )
            }
          />
        </div>

        <div className="grid gap-5 md:grid-cols-2">

          <div>
            <label className={labelClass}>
              Download Limit
            </label>

            <input
              type="number"
              min="1"
              className={inputClass}
              value={downloadLimit}
              onChange={(e) =>
                setDownloadLimit(e.target.value)
              }
              placeholder="Unlimited"
            />
          </div>

          <div>
            <label className={labelClass}>
              Link Expiry (Hours)
            </label>

            <input
              type="number"
              min="1"
              className={inputClass}
              value={linkExpiryHours}
              onChange={(e) =>
                setLinkExpiryHours(e.target.value)
              }
              placeholder="Unlimited"
            />
          </div>

        </div>
      </div>

      {/* WHATSAPP */}

      <div className="space-y-6 rounded-xl border border-slate-200 bg-white p-6">

        <h2 className="text-lg font-semibold text-slate-900">
          WhatsApp
        </h2>

        <textarea
          className={inputClass}
          rows={5}
          value={whatsappMessageTemplate}
          onChange={(e) =>
            setWhatsappMessageTemplate(
              e.target.value
            )
          }
        />

      </div>

      {/* SEO */}

      <div className="space-y-6 rounded-xl border border-slate-200 bg-white p-6">

        <h2 className="text-lg font-semibold text-slate-900">
          SEO
        </h2>

        <div>
          <label className={labelClass}>
            SEO Title
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
            SEO Description
          </label>

          <textarea
            className={inputClass}
            rows={4}
            value={seoDescription}
            onChange={(e) =>
              setSeoDescription(e.target.value)
            }
          />
        </div>

      </div>

      {/* PRODUCT STATUS */}

      <div className="space-y-5 rounded-xl border border-slate-200 bg-white p-6">

        <h2 className="text-lg font-semibold text-slate-900">
          Product Status
        </h2>

        <div>
          <label className={labelClass}>
            Status
          </label>

          <select
            className={inputClass}
            value={status}
            onChange={(e) =>
              setStatus(
                e.target.value as Product["status"]
              )
            }
          >
            <option value="DRAFT">
              Draft
            </option>

            <option value="PUBLISHED">
              Published
            </option>

            <option value="UNPUBLISHED">
              Unpublished
            </option>
          </select>
        </div>

        <label className="flex items-center gap-3 text-sm text-slate-900">
          <input
            type="checkbox"
            checked={isFeatured}
            onChange={(e) =>
              setIsFeatured(e.target.checked)
            }
          />

          Featured Product
        </label>

        <label className="flex items-center gap-3 text-sm text-slate-900">
          <input
            type="checkbox"
            checked={isBestseller}
            onChange={(e) =>
              setIsBestseller(e.target.checked)
            }
          />

          Bestseller
        </label>

        <label className="flex items-center gap-3 text-sm text-slate-900">
          <input
            type="checkbox"
            checked={isLimitedOffer}
            onChange={(e) =>
              setIsLimitedOffer(e.target.checked)
            }
          />

          Limited Offer
        </label>

      </div>

      {/* ACTIONS */}

      <div className="flex flex-wrap gap-3 pb-10">

        <button
          type="button"
          onClick={() =>
            router.push("/admin/products")
          }
          disabled={saving || thumbnailUploading}
          className="rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-medium text-slate-900 disabled:opacity-50"
        >
          Cancel
        </button>

        <button
          type="button"
          onClick={saveChanges}
          disabled={
            saving ||
            thumbnailUploading ||
            uploading
          }
          className="rounded-lg bg-black px-6 py-2.5 text-sm font-medium text-white disabled:opacity-50"
        >
          {saving
            ? "Saving..."
            : "Save Changes"}
        </button>

      </div>

    </div>
  );
}