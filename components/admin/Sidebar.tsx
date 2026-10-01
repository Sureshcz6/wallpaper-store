
"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const links = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/products", label: "Products" },
  { href: "/admin/categories", label: "Categories" },
  { href: "/admin/orders", label: "Orders" },
  { href: "/admin/reviews", label: "Reviews" },
  { href: "/admin/coupons", label: "Coupons" },
  { href: "/admin/settings", label: "Settings" },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!mobileOpen) {
      document.body.style.overflow = "";
      return;
    }

    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  async function handleLogout() {
    await fetch("/api/admin/logout", {
      method: "POST",
    });

    router.replace("/admin/login");
    router.refresh();
  }

  return (
    <>
      {/* Mobile top bar */}
      <div className="sticky top-0 z-40 flex items-center justify-between border-b border-border bg-bg/95 px-4 py-3 backdrop-blur md:hidden">
        <p className="font-display text-sm text-ink">Admin</p>

        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          aria-label="Open admin menu"
          aria-expanded={mobileOpen}
          className="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-ink transition-colors hover:bg-bg"
        >
          Menu
        </button>
      </div>

      {/* Desktop sidebar */}
      <aside className="hidden w-56 shrink-0 border-r border-border p-4 md:block">
        <p className="mb-6 px-2 font-display text-sm text-ink">Admin</p>

        <nav className="space-y-1">
          {links.map((link) => {
            const active = pathname === link.href;

            return (
              <Link
                key={link.href}
                href={link.href}
                className={`block rounded-lg px-3 py-2 text-sm transition-colors ${
                  active
                    ? "bg-surface text-ink"
                    : "text-muted hover:text-ink"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <button
          type="button"
          onClick={handleLogout}
          className="mt-6 w-full rounded-lg px-3 py-2 text-left text-sm text-muted transition-colors hover:text-ink"
        >
          Logout
        </button>
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/50 md:hidden"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Mobile drawer */}
      <aside
        className={`fixed inset-y-0 left-0 z-[60] w-[280px] max-w-[85vw] border-r border-border bg-bg p-4 shadow-2xl transition-transform duration-200 md:hidden ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        aria-hidden={!mobileOpen}
      >
        <div className="flex items-center justify-between">
          <p className="font-display text-sm text-ink">Admin</p>

          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            aria-label="Close admin menu"
            className="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-muted transition-colors hover:text-ink"
          >
            Close
          </button>
        </div>

        <nav className="mt-6 space-y-1">
          {links.map((link) => {
            const active = pathname === link.href;

            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className={`block rounded-lg px-3 py-3 text-sm transition-colors ${
                  active
                    ? "bg-surface text-ink"
                    : "text-muted hover:bg-surface hover:text-ink"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <button
          type="button"
          onClick={handleLogout}
          className="mt-6 w-full rounded-lg px-3 py-3 text-left text-sm text-muted transition-colors hover:bg-surface hover:text-ink"
        >
          Logout
        </button>
      </aside>
    </>
  );
}
