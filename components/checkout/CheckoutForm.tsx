"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Script from "next/script";

type Props = {
  product: {
    id: string;
    name: string;
    price: number;
    priceDisplay: string;
  };
};

export function CheckoutForm({ product }: Props) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [coupon, setCoupon] = useState("");
  const [couponMessage, setCouponMessage] = useState<string | null>(null);
  const [finalAmountDisplay, setFinalAmountDisplay] = useState<string | null>(null);
  const [loading, setLoading] = useState<"idle" | "applying" | "paying" | "verifying">("idle");
  const [error, setError] = useState<string | null>(null);

  async function applyCoupon() {
    if (!coupon.trim()) return;
    setLoading("applying");
    setError(null);
    try {
      const res = await fetch("/api/coupons/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: coupon, productId: product.id })
      });
      const data = await res.json();
      if (!data.valid) {
        setCouponMessage(data.message ?? "This coupon is invalid or expired.");
        setFinalAmountDisplay(null);
      } else {
        setCouponMessage(`Coupon applied — you save ${data.discountDisplay}.`);
        setFinalAmountDisplay(data.finalAmountDisplay);
      }
    } catch {
      setCouponMessage("Something went wrong. Please check your connection and try again.");
    } finally {
      setLoading("idle");
    }
  }

  async function handlePay() {
    setError(null);
    if (!name.trim() || !email.trim() || !phone.trim()) {
      setError("Please fill in your name, email and WhatsApp number.");
      return;
    }
    setLoading("paying");
    try {
      const createRes = await fetch("/api/orders/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: product.id,
          customerName: name,
          customerEmail: email,
          customerPhone: phone,
          couponCode: coupon || undefined
        })
      });
      const order = await createRes.json();
      if (!createRes.ok) {
        setError(order.error ?? "Something went wrong. Please try again.");
        setLoading("idle");
        return;
      }

      const rzp = new (window as any).Razorpay({
        key: order.keyId,
        amount: order.amount,
        currency: order.currency,
        name: "Digital Marketplace",
        description: order.productName,
        order_id: order.razorpayOrderId,
        prefill: { name: order.customerName, email: order.customerEmail, contact: order.customerPhone },
        theme: { color: "#7c5cff" },
        handler: async function (response: any) {
          setLoading("verifying");
          const verifyRes = await fetch("/api/orders/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              orderId: order.orderId
            })
          });
          const verified = await verifyRes.json();
          if (!verifyRes.ok || !verified.success) {
            setError(verified.error ?? "Payment could not be completed. Please try again.");
            setLoading("idle");
            return;
          }
          router.push(
            `/success?order=${encodeURIComponent(verified.orderNumber)}&name=${encodeURIComponent(
              verified.customerName
            )}&product=${encodeURIComponent(verified.productName)}&amount=${verified.amount}&download=${encodeURIComponent(
              verified.downloadUrl ?? ""
            )}`
          );
        },
        modal: {
          ondismiss: function () {
            setLoading("idle");
          }
        }
      });
      rzp.open();
    } catch {
      setError("Something went wrong. Please check your connection and try again.");
      setLoading("idle");
    }
  }

  const isBusy = loading !== "idle";

  return (
    <>
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />
      <div className="space-y-4">
        <div>
          <label className="mb-1 block text-sm text-muted">Full name</label>
          <input
            className="w-full rounded-lg border border-border bg-surface px-4 py-2.5 text-sm text-ink focus-ring"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm text-muted">Email</label>
          <input
            type="email"
            className="w-full rounded-lg border border-border bg-surface px-4 py-2.5 text-sm text-ink focus-ring"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm text-muted">WhatsApp number</label>
          <input
            className="w-full rounded-lg border border-border bg-surface px-4 py-2.5 text-sm text-ink focus-ring"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+91 XXXXX XXXXX"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm text-muted">Coupon code (optional)</label>
          <div className="flex gap-2">
            <input
              className="flex-1 rounded-lg border border-border bg-surface px-4 py-2.5 text-sm text-ink focus-ring"
              value={coupon}
              onChange={(e) => setCoupon(e.target.value)}
              placeholder="SAVE20"
            />
            <button
              type="button"
              onClick={applyCoupon}
              disabled={isBusy}
              className="rounded-lg border border-border px-4 text-sm text-ink hover:border-accent transition-colors disabled:opacity-50"
            >
              Apply
            </button>
          </div>
          {couponMessage && <p className="mt-2 text-xs text-muted">{couponMessage}</p>}
        </div>

        <div className="rounded-card border border-border bg-surface p-4">
          <div className="flex justify-between text-sm text-muted">
            <span>{product.name}</span>
            <span>{finalAmountDisplay ?? product.priceDisplay}</span>
          </div>
        </div>

        {error && <p className="text-sm text-red-400">{error}</p>}

        <button
          onClick={handlePay}
          disabled={isBusy}
          className="w-full rounded-full bg-accent py-3 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          {loading === "paying" && "Processing..."}
          {loading === "verifying" && "Verifying payment..."}
          {loading === "idle" && `Pay ${finalAmountDisplay ?? product.priceDisplay}`}
        </button>
      </div>
    </>
  );
}
