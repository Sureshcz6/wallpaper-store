import { Navbar } from "@/components/ui/Navbar";
import { Footer } from "@/components/ui/Footer";

export default function RefundPolicyPage() {
  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-2xl px-5 py-12 text-sm text-muted">
        <h1 className="mb-4 font-display text-2xl text-ink">Refund Policy</h1>
        <p>
          Replace this placeholder with your actual refund rules for digital products (e.g. no refunds
          once a download link has been accessed, or a specific window for support-assisted refunds).
          State only what you will actually honor.
        </p>
      </main>
      <Footer />
    </>
  );
}
