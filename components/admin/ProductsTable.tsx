
"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";

import { formatINR } from "@/lib/utils";

type Row = {
  id: string;
  name: string;
  price: number;
  status: string;
  createdAt: string;
  thumbnailUrl: string | null;
  category: { name: string } | null;
  _count: { orders: number };
};

export function ProductsTable({ products }: { products: Row[] }) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);

  async function togglePublish(id: string, current: string) {
    setBusyId(id);

    const nextStatus =
      current === "PUBLISHED" ? "UNPUBLISHED" : "PUBLISHED";

    await fetch(`/api/products/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        status: nextStatus,
      }),
    });

    setBusyId(null);
    router.refresh();
  }

  async function remove(id: string) {
    if (!confirm("Are you sure you want to delete this product?")) {
      return;
    }

    setBusyId(id);

    await fetch(`/api/products/${id}`, {
      method: "DELETE",
    });

    setBusyId(null);
    router.refresh();
  }

  if (products.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-surface p-6">
        <p className="text-sm text-muted">No products available yet.</p>
      </div>
    );
  }

  return (
    <div className="w-full overflow-x-auto rounded-xl border border-border bg-surface">
      <table className="w-full min-w-[900px] text-left text-sm">
        <thead className="bg-bg text-muted">
          <tr className="border-b border-border">
            <th className="px-4 py-3 font-normal">Product</th>
            <th className="px-4 py-3 font-normal">Category</th>
            <th className="px-4 py-3 font-normal">Price</th>
            <th className="px-4 py-3 font-normal">Sales</th>
            <th className="px-4 py-3 font-normal">Status</th>
            <th className="px-4 py-3 font-normal">Actions</th>
          </tr>
        </thead>

        <tbody>
          {products.map((p) => (
            <tr
              key={p.id}
              className="border-b border-border/50 last:border-b-0 hover:bg-bg/50"
            >
              {/* Product */}
              <td className="px-4 py-3">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg border border-border bg-bg">
                    {p.thumbnailUrl ? (
                      <img
                        src={p.thumbnailUrl}
                        alt={p.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-[10px] text-muted">
                        No image
                      </div>
                    )}
                  </div>

                  <span className="whitespace-nowrap text-ink">
                    {p.name}
                  </span>
                </div>
              </td>

              {/* Category */}
              <td className="whitespace-nowrap px-4 py-3 text-muted">
                {p.category?.name ?? "—"}
              </td>

              {/* Price */}
              <td className="whitespace-nowrap px-4 py-3 text-muted">
                {formatINR(p.price)}
              </td>

              {/* Sales */}
              <td className="whitespace-nowrap px-4 py-3 text-muted">
                {p._count.orders}
              </td>

              {/* Status */}
              <td className="px-4 py-3">
                <span
                  className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-xs ${
                    p.status === "PUBLISHED"
                      ? "bg-emerald-500/10 text-emerald-400"
                      : "bg-surface text-muted"
                  }`}
                >
                  {p.status}
                </span>
              </td>

              {/* Actions */}
              <td className="px-4 py-3">
                <div className="flex items-center gap-3 whitespace-nowrap">
                  <Link
                    href={`/admin/products/${p.id}`}
                    className="text-accent-2 hover:underline"
                  >
                    Edit
                  </Link>

                  <button
                    type="button"
                    disabled={busyId === p.id}
                    onClick={() => togglePublish(p.id, p.status)}
                    className="text-muted transition-colors hover:text-ink disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {p.status === "PUBLISHED" ? "Unpublish" : "Publish"}
                  </button>

                  <button
                    type="button"
                    disabled={busyId === p.id}
                    onClick={() => remove(p.id)}
                    className="text-red-400 transition-colors hover:text-red-300 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Delete
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
