import { Navbar } from "@/components/ui/Navbar";
import { Footer } from "@/components/ui/Footer";

export default function TermsPage() {
  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-2xl px-5 py-12 text-sm text-muted">
        <h1 className="mb-4 font-display text-2xl text-ink">Terms of Service</h1>
        <p>
          Replace this placeholder with your actual terms: what you sell, how payment and delivery work,
          and the rules customers agree to when purchasing. Do not publish invented legal guarantees -
          have this reviewed by a professional before going live.
        </p>
      </main>
      <Footer />
    </>
  );
}
