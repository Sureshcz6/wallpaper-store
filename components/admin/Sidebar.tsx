"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const links = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/products", label: "Products" },
  { href: "/admin/categories", label: "Categories" },
  { href: "/admin/orders", label: "Orders" },
  { href: "/admin/reviews", label: "Reviews" },
  { href: "/admin/coupons", label: "Coupons" },
  { href: "/admin/settings", label: "Settings" }
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  }

  return (
    <aside className="hidden w-56 shrink-0 border-r border-border p-4 md:block">
      <p className="mb-6 px-2 font-display text-sm text-ink">Admin</p>
      <nav className="space-y-1">
        {links.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className={`block rounded-lg px-3 py-2 text-sm transition-colors ${
              pathname === l.href ? "bg-surface text-ink" : "text-muted hover:text-ink"
            }`}
          >
            {l.label}
          </Link>
        ))}
      </nav>
      <button
        onClick={handleLogout}
        className="mt-6 w-full rounded-lg px-3 py-2 text-left text-sm text-muted hover:text-ink transition-colors"
      >
        Logout
      </button>
    </aside>
  );
}
