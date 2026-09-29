import Link from "next/link";
import { Navbar } from "@/components/ui/Navbar";
import { Footer } from "@/components/ui/Footer";
import { buildWaMeLink } from "@/lib/whatsapp";

export default function SuccessPage({
  searchParams
}: {
  searchParams: { order?: string; name?: string; product?: string; amount?: string; download?: string };
}) {
  const { order, name, product, amount, download } = searchParams;
  const amountDisplay = amount ? `₹${(Number(amount) / 100).toLocaleString("en-IN")}` : "";
  const whatsappLink = buildWaMeLink({ message: `Hi, I just purchased ${product ?? "a product"} (Order ${order ?? ""}).` });

  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-md px-5 py-16 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-accent-2/10 text-2xl text-accent-2">
          ✓
        </div>
        <h1 className="font-display text-2xl text-ink">Payment successful</h1>
        <p className="mt-2 text-muted">Thank you{name ? `, ${name}` : ""}!</p>

        <div className="mt-6 rounded-card border border-border bg-surface p-5 text-left text-sm">
          <div className="flex justify-between py-1"><span className="text-muted">Order ID</span><span className="text-ink">{order}</span></div>
          <div className="flex justify-between py-1"><span className="text-muted">Product</span><span className="text-ink">{product}</span></div>
          <div className="flex justify-between py-1"><span className="text-muted">Amount</span><span className="text-ink">{amountDisplay}</span></div>
        </div>

        <div className="mt-6 space-y-3">
          {download && (
            <Link href={download} className="block w-full rounded-full bg-accent py-3 text-sm font-medium text-white">
              Download Product
            </Link>
          )}
          <a href={whatsappLink} target="_blank" rel="noopener noreferrer" className="block w-full rounded-full border border-border py-3 text-sm text-ink hover:border-accent-2 transition-colors">
            Open WhatsApp
          </a>
          <Link href="/products" className="block w-full rounded-full border border-border py-3 text-sm text-ink hover:border-accent transition-colors">
            Contact Support
          </Link>
        </div>
      </main>
      <Footer />
    </>
  );
}
