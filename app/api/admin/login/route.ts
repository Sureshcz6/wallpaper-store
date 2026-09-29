import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { adminLoginSchema } from "@/lib/validation";
import { verifyPassword, createAdminSession, checkLoginRateLimit } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for") ?? "unknown";
  const body = await req.json().catch(() => null);
  const parsed = adminLoginSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Please enter a valid email and password." }, { status: 400 });
  }
  const { email, password } = parsed.data;

  const rateLimitKey = `${ip}:${email}`;
  const rate = checkLoginRateLimit(rateLimitKey);
  if (!rate.allowed) {
    return NextResponse.json(
      { error: "Too many login attempts. Please try again later." },
      { status: 429 }
    );
  }

  const admin = await prisma.admin.findUnique({ where: { email } });
  if (!admin) {
    return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
  }

  const valid = await verifyPassword(password, admin.passwordHash);
  if (!valid) {
    return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
  }

  await createAdminSession(admin.id, admin.email);
  return NextResponse.json({ success: true });
}
