"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Coupon = {
  id: string;
  code: string;
  discountType: string;
  percentage: number | null;
  fixedAmount: number | null;
  isActive: boolean;
};

export function CouponManager({ coupons }: { coupons: Coupon[] }) {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [percentage, setPercentage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function create() {
    setError(null);
    if (!code.trim() || !percentage) {
      setError("Enter a code and a percentage.");
      return;
    }
    setLoading(true);
    const res = await fetch("/api/coupons", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code, discountType: "PERCENTAGE", percentage: Number(percentage), isActive: true })
    });
    const data = await res.json();
    if (!res.ok) setError(data.error ?? "Something went wrong.");
    setCode("");
    setPercentage("");
    setLoading(false);
    router.refresh();
  }

  async function remove(id: string) {
    if (!confirm("Are you sure you want to delete this coupon?")) return;
    await fetch(`/api/coupons/${id}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap gap-2">
        <input
          className="rounded-lg border border-border bg-surface px-4 py-2.5 text-sm text-ink focus-ring"
          placeholder="CODE"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
        />
        <input
          type="number"
          className="w-32 rounded-lg border border-border bg-surface px-4 py-2.5 text-sm text-ink focus-ring"
          placeholder="% off"
          value={percentage}
          onChange={(e) => setPercentage(e.target.value)}
        />
        <button onClick={create} disabled={loading} className="rounded-full bg-accent px-4 py-2 text-sm font-medium text-white disabled:opacity-60">
          {loading ? "Creating..." : "Create Coupon"}
        </button>
      </div>
      {error && <p className="mb-4 text-sm text-red-400">{error}</p>}

      {coupons.length === 0 ? (
        <p className="text-muted">No coupons created.</p>
      ) : (
        <div className="space-y-2">
          {coupons.map((c) => (
            <div key={c.id} className="flex items-center justify-between rounded-lg border border-border bg-surface px-4 py-2.5 text-sm">
              <span className="text-ink">{c.code}</span>
              <span className="text-muted">{c.percentage ? `${c.percentage}% off` : `₹${(c.fixedAmount ?? 0) / 100} off`}</span>
              <span className="text-muted">{c.isActive ? "Active" : "Inactive"}</span>
              <button onClick={() => remove(c.id)} className="text-red-400 hover:underline">Delete</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
