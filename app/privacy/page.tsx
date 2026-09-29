import { Navbar } from "@/components/ui/Navbar";
import { Footer } from "@/components/ui/Footer";

export default function PrivacyPage() {
  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-2xl px-5 py-12 text-sm text-muted">
        <h1 className="mb-4 font-display text-2xl text-ink">Privacy Policy</h1>
        <p>
          Replace this placeholder with an accurate description of what customer data you collect
          (name, email, WhatsApp number at checkout), how it's stored, and who it's shared with
          (e.g. Razorpay for payment processing, your WhatsApp provider for delivery messages).
        </p>
      </main>
      <Footer />
    </>
  );
}
