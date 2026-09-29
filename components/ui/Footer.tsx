import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-5 py-10 text-sm text-muted md:flex-row md:items-center md:justify-between">
        <p>© {new Date().getFullYear()} Digital Marketplace. All rights reserved.</p>
        <div className="flex gap-6">
          <Link href="/terms" className="hover:text-ink transition-colors">Terms</Link>
          <Link href="/privacy" className="hover:text-ink transition-colors">Privacy</Link>
          <Link href="/refund-policy" className="hover:text-ink transition-colors">Refunds</Link>
        </div>
      </div>
    </footer>
  );
}
