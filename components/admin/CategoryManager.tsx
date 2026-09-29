"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function CategoryManager({ categories }: { categories: { id: string; name: string; slug: string }[] }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  async function addCategory() {
    if (!name.trim()) return;
    setLoading(true);
    await fetch("/api/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name })
    });
    setName("");
    setLoading(false);
    router.refresh();
  }

  return (
    <div>
      <div className="mb-6 flex gap-2">
        <input
          className="flex-1 rounded-lg border border-border bg-surface px-4 py-2.5 text-sm text-ink focus-ring"
          placeholder="New category name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <button
          onClick={addCategory}
          disabled={loading}
          className="rounded-full bg-accent px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
        >
          {loading ? "Adding..." : "Add"}
        </button>
      </div>
      {categories.length === 0 ? (
        <p className="text-muted">No categories created.</p>
      ) : (
        <ul className="space-y-2">
          {categories.map((c) => (
            <li key={c.id} className="rounded-lg border border-border bg-surface px-4 py-2.5 text-sm text-ink">
              {c.name}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
