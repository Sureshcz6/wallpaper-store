import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { formatINR } from "@/lib/utils";
import { Navbar } from "@/components/ui/Navbar";
import { Footer } from "@/components/ui/Footer";
import { CheckoutForm } from "@/components/checkout/CheckoutForm";
import { isRazorpayConfigured } from "@/lib/razorpay";

export default async function CheckoutPage({ searchParams }: { searchParams: { product?: string } }) {
  if (!searchParams.product) notFound();

  const product = await prisma.product.findUnique({ where: { slug: searchParams.product } });
  if (!product || product.status !== "PUBLISHED") notFound();

  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-xl px-5 py-12">
        <h1 className="mb-6 font-display text-2xl text-ink">Checkout</h1>
        {!isRazorpayConfigured() ? (
          <div className="rounded-card border border-border bg-surface p-6 text-sm text-muted">
            Payments are not configured yet. Please contact support to complete this purchase.
          </div>
        ) : (
          <CheckoutForm
            product={{ id: product.id, name: product.name, price: product.price, priceDisplay: formatINR(product.price) }}
          />
        )}
      </main>
      <Footer />
    </>
  );
}
