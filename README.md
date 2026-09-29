# Digital Marketplace

A production-architecture Next.js 14 (App Router) + TypeScript + Prisma/PostgreSQL
digital-products storefront, built to the brief: no customer accounts, Razorpay
checkout with server-side signature verification, secure token-based delivery,
WhatsApp confirmation, and a full admin panel.

## What's real vs. what needs your credentials

Every route in this codebase is wired to the database and to real integration
points - nothing is mocked with fake data or fake success responses. Three
things need your own credentials before they work end-to-end, and until then
the app reports their status honestly rather than pretending:

| Integration | Status without config | What to add |
|---|---|---|
| Razorpay | Checkout page shows "Payments are not configured yet" | `NEXT_PUBLIC_RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET` |
| WhatsApp Business API | Automated messages are skipped (order still succeeds); the plain `wa.me` chat button always works | `WHATSAPP_ACCESS_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID` |
| Object storage (S3/R2/Supabase) | Downloads return "temporarily unavailable" unless a product uses `externalDeliveryUrl` instead | `STORAGE_ENDPOINT`, `STORAGE_ACCESS_KEY`, `STORAGE_SECRET_KEY`, `STORAGE_BUCKET` and swapping the placeholder signer in `lib/storage.ts` for your provider's real presigned-URL SDK call |

## Getting started

This was written in a sandboxed environment with no network access, so it
has **not** been run through `npm install` / `next build` / `prisma migrate`
here - do that in your own environment first:

```bash
npm install
cp .env.example .env        # fill in real values
npx prisma migrate dev --name init
npm run db:seed             # creates an admin login + 2 demo products
npm run dev
```

Seeded admin login (change immediately): the email from `ADMIN_EMAIL` in
`.env`, password `ChangeThisPassword123!`.

To generate a real password hash for production:
```bash
node -e "require('argon2').hash('yourRealPassword').then(console.log)"
```
Put the result in `ADMIN_PASSWORD_HASH`, or update the `Admin` row directly.

## Architecture

```
app/
  page.tsx                     Homepage
  products/                    Product grid, search, filter, sort
  product/[slug]/              Product detail: gallery, reviews, FAQ, related
  checkout/                    Name/email/WhatsApp + coupon + Razorpay Checkout
  success/                     Post-payment confirmation + download + WhatsApp link
  download/[token]/            Secure, token-gated delivery page
  admin/                       Login, dashboard, products, categories, orders,
                               reviews, coupons, settings (all behind middleware)
  api/
    orders/create              Server-side Razorpay order creation (recomputes price)
    orders/verify               Server-side HMAC signature verification (idempotent)
    webhooks/razorpay           Idempotent webhook fallback for payment.captured/failed
    download/[token]            Verifies PAID + expiry + download limit, issues signed URLs
    products, categories,
    reviews, coupons, settings  Admin CRUD, each checking the session server-side
lib/
  auth.ts        Argon2 hashing, JWT session cookie (httpOnly, sameSite), login rate limiting
  razorpay.ts    Order creation + HMAC verification for both checkout and webhooks
  whatsapp.ts    wa.me link builder + optional Cloud API send, honest NOT_CONFIGURED state
  storage.ts     Signed-URL abstraction - swap in your provider's SDK
  validation.ts  Zod schemas for every input boundary (checkout, product, coupon, review, login)
middleware.ts    Blocks /admin/* and /api/admin/* without a valid session cookie
prisma/schema.prisma   Full relational schema: Admin, Category, Product, ProductImage,
                       ProductFile, Order, Review, Coupon, SiteSetting, WhatsAppSetting
```

## Security choices already implemented

- Passwords hashed with Argon2; sessions are httpOnly/sameSite JWT cookies, never localStorage.
- Every `/admin` page and `/api/admin/*` route is blocked by `middleware.ts` before it runs.
- The checkout amount is **always** recomputed server-side from the database + coupon
  rules - the client only ever sends a product id and (optional) coupon code, never an amount.
- Razorpay payments are confirmed by recomputing the HMAC signature server-side
  (`lib/razorpay.ts`), not by trusting the browser's "payment successful" callback.
  The webhook handler is a second, independent path to the same PAID state, and both
  paths are idempotent (checked via `razorpayOrderId` / stored webhook event ids).
- Digital files are referenced by opaque `storageKey`, never a public URL, and are
  only ever handed out as short-lived signed URLs, gated on `paymentStatus === PAID`,
  link expiry, and per-product download limits.
- Zod validates every request body before it touches the database.

## Known gaps to close before a real launch

- `lib/storage.ts` ships a placeholder signer so the app runs without an object-storage
  account; replace it with your provider's real presigned-URL call (S3/R2 SDK or Supabase Storage).
- The rate limiter in `lib/auth.ts` is in-memory, fine for a single instance; move it to
  a shared store (Redis/Upstash) once you deploy more than one server instance.
- Product image upload is URL-based in this build (paste a hosted image URL) rather than
  a direct file-upload widget; wire `components/admin/ProductForm.tsx` to your storage
  provider's upload API to add drag-and-drop uploads.
- Legal pages (`/terms`, `/privacy`, `/refund-policy`) are clearly-labeled placeholders -
  have real ones reviewed before launch.
- No automated test suite is included; add integration tests around
  `/api/orders/create`, `/api/orders/verify`, and `/api/webhooks/razorpay` before launch,
  since these are the most security-sensitive paths.
