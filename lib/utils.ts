import crypto from "crypto";

/** Format paise as an INR display string, e.g. 9900 -> "₹99" */
export function formatINR(paise: number): string {
  const rupees = paise / 100;
  return `₹${rupees.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
}

/** Derive discount percentage from original vs selling price. Never trust a manually stored percentage. */
export function computeDiscountPercent(originalPrice: number, price: number): number {
  if (originalPrice <= 0 || price >= originalPrice) return 0;
  return Math.round(((originalPrice - price) / originalPrice) * 100);
}

export function generateOrderNumber(): string {
  const stamp = Date.now().toString(36).toUpperCase();
  const rand = crypto.randomBytes(3).toString("hex").toUpperCase();
  return `ORD-${stamp}-${rand}`;
}

/** Cryptographically random, hard-to-guess delivery token. */
export function generateDownloadToken(): string {
  return crypto.randomBytes(32).toString("base64url");
}

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}
