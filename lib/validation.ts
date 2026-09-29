import { z } from "zod";

export const checkoutSchema = z.object({
  productId: z.string().min(1),
  customerName: z.string().trim().min(2, "Please enter your full name").max(120),
  customerEmail: z.string().trim().email("Please enter a valid email"),
  customerPhone: z
    .string()
    .trim()
    .regex(/^[0-9+\-\s]{8,15}$/, "Please enter a valid WhatsApp/mobile number"),
  couponCode: z.string().trim().max(40).optional().or(z.literal(""))
});

export const verifyPaymentSchema = z.object({
  razorpay_order_id: z.string().min(1),
  razorpay_payment_id: z.string().min(1),
  razorpay_signature: z.string().min(1),
  orderId: z.string().min(1) // our internal Order.id
});

export const productSchema = z.object({
  name: z.string().min(2).max(160),
  slug: z.string().min(2).max(180),
  categoryId: z.string().min(1),
  shortDescription: z.string().min(2).max(280),
  fullDescription: z.string().min(2),
  price: z.number().int().positive(),
  originalPrice: z.number().int().positive(),
  thumbnailUrl: z.string().url(),
  previewVideoUrl: z.string().url().optional().or(z.literal("")),
  features: z.array(z.string()).default([]),
  whatsIncluded: z.array(z.string()).default([]),
  faqs: z.array(z.object({ question: z.string(), answer: z.string() })).default([]),
  tags: z.array(z.string()).default([]),
  externalDeliveryUrl: z.string().url().optional().or(z.literal("")),
  seoTitle: z.string().optional(),
  seoDescription: z.string().optional(),
  status: z.enum(["DRAFT", "PUBLISHED", "UNPUBLISHED"]).default("DRAFT"),
  isFeatured: z.boolean().default(false),
  isBestseller: z.boolean().default(false),
  isLimitedOffer: z.boolean().default(false),
  whatsappMessageTemplate: z.string().optional(),
  deliveryInstructions: z.string().optional(),
  downloadLimit: z.number().int().positive().nullable().optional(),
  linkExpiryHours: z.number().int().positive().nullable().optional()
});

export const couponSchema = z.object({
  code: z.string().min(3).max(40),
  discountType: z.enum(["PERCENTAGE", "FIXED"]),
  percentage: z.number().int().min(1).max(100).optional(),
  fixedAmount: z.number().int().positive().optional(),
  minimumOrder: z.number().int().positive().optional(),
  maximumDiscount: z.number().int().positive().optional(),
  startDate: z.string().optional(),
  expiryDate: z.string().optional(),
  usageLimit: z.number().int().positive().optional(),
  perCustomerLimit: z.number().int().positive().optional(),
  isActive: z.boolean().default(true)
});

export const reviewSchema = z.object({
  productId: z.string().min(1),
  name: z.string().min(2).max(80),
  rating: z.number().int().min(1).max(5),
  reviewText: z.string().min(2).max(2000)
});

export const adminLoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6)
});
