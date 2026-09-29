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
  category: { name: string } | null;
  _count: { orders: number };
};

export function ProductsTable({ products }: { products: Row[] }) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);

  async function togglePublish(id: string, current: string) {
    setBusyId(id);
    const nextStatus = current === "PUBLISHED" ? "UNPUBLISHED" : "PUBLISHED";
    await fetch(`/api/products/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: nextStatus })
    });
    setBusyId(null);
    router.refresh();
  }

  async function remove(id: string) {
    if (!confirm("Are you sure you want to delete this product?")) return;
    setBusyId(id);
    await fetch(`/api/products/${id}`, { method: "DELETE" });
    setBusyId(null);
    router.refresh();
  }

  if (products.length === 0) {
    return <p className="text-muted">No products available yet.</p>;
  }

  return (
    <table className="w-full text-left text-sm">
      <thead className="text-muted">
        <tr className="border-b border-border">
          <th className="py-2 font-normal">Product</th>
          <th className="py-2 font-normal">Category</th>
          <th className="py-2 font-normal">Price</th>
          <th className="py-2 font-normal">Sales</th>
          <th className="py-2 font-normal">Status</th>
          <th className="py-2 font-normal">Actions</th>
        </tr>
      </thead>
      <tbody>
        {products.map((p) => (
          <tr key={p.id} className="border-b border-border/50">
            <td className="py-3 text-ink">{p.name}</td>
            <td className="py-3 text-muted">{p.category?.name ?? "—"}</td>
            <td className="py-3 text-muted">{formatINR(p.price)}</td>
            <td className="py-3 text-muted">{p._count.orders}</td>
            <td className="py-3 text-muted">{p.status}</td>
            <td className="py-3">
              <div className="flex gap-3">
                <Link href={`/admin/products/${p.id}`} className="text-accent-2 hover:underline">Edit</Link>
                <button
                  disabled={busyId === p.id}
                  onClick={() => togglePublish(p.id, p.status)}
                  className="text-muted hover:text-ink"
                >
                  {p.status === "PUBLISHED" ? "Unpublish" : "Publish"}
                </button>
                <button
                  disabled={busyId === p.id}
                  onClick={() => remove(p.id)}
                  className="text-red-400 hover:text-red-300"
                >
                  Delete
                </button>
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
