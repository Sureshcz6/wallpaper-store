import Link from "next/link";

export function Navbar() {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-bg/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
        <Link href="/" className="font-display text-lg tracking-tight text-ink">
          Digital Marketplace
        </Link>
        <nav className="hidden items-center gap-8 text-sm text-muted md:flex">
          <Link href="/" className="hover:text-ink transition-colors">Home</Link>
          <Link href="/products" className="hover:text-ink transition-colors">Products</Link>
          <Link href="/products" className="hover:text-ink transition-colors">Categories</Link>
        </nav>
        <div className="flex items-center gap-3">
          <Link
            href="/products"
            aria-label="Search products"
            className="rounded-full border border-border p-2 text-muted hover:text-ink transition-colors focus-ring"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="7" />
              <path d="m21 21-4.3-4.3" />
            </svg>
          </Link>
          <Link
            href="/admin/login"
            aria-label="Admin"
            className="rounded-full border border-border p-2 text-muted/50 hover:text-muted transition-colors focus-ring"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2 4 5v6c0 5 3.5 8.5 8 11 4.5-2.5 8-6 8-11V5l-8-3Z" />
            </svg>
          </Link>
        </div>
      </div>
    </header>
  );
}
