"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Row = {
  id: string;
  name: string;
  rating: number;
  reviewText: string;
  status: string;
  verifiedPurchase: boolean;
  product: { name: string };
};

export function ReviewsModeration({ reviews }: { reviews: Row[] }) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);

  async function updateStatus(id: string, status: "APPROVED" | "REJECTED") {
    setBusyId(id);
    // Minimal inline PATCH via the same resource - reuse PUT-style route would
    // normally live at /api/reviews/[id]; kept here as a direct fetch for brevity.
    await fetch(`/api/reviews/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status })
    });
    setBusyId(null);
    router.refresh();
  }

  if (reviews.length === 0) return <p className="text-muted">No reviews yet.</p>;

  return (
    <div className="space-y-3">
      {reviews.map((r) => (
        <div key={r.id} className="rounded-card border border-border bg-surface p-4">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-sm font-medium text-ink">{r.name}</span>
              <span className="ml-2 text-xs text-muted">{r.product.name}</span>
            </div>
            <span className="text-xs text-muted">{r.status}</span>
          </div>
          <p className="mt-2 text-sm text-muted">★ {r.rating} — {r.reviewText}</p>
          <div className="mt-3 flex gap-3 text-sm">
            <button disabled={busyId === r.id} onClick={() => updateStatus(r.id, "APPROVED")} className="text-accent-2 hover:underline">Approve</button>
            <button disabled={busyId === r.id} onClick={() => updateStatus(r.id, "REJECTED")} className="text-red-400 hover:underline">Reject</button>
          </div>
        </div>
      ))}
    </div>
  );
}
