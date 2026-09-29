import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAdminSession } from "@/lib/auth";
import { getWhatsAppStatus } from "@/lib/whatsapp";

export async function GET() {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const settings = await prisma.whatsAppSetting.upsert({
    where: { id: "singleton" },
    update: {},
    create: { id: "singleton" }
  });
  return NextResponse.json({ settings, status: getWhatsAppStatus() });
}

/**
 * NOTE: this endpoint stores non-secret configuration (provider name, phone
 * number id, message template, automation toggle) in the database. The real
 * access token must be set as the WHATSAPP_ACCESS_TOKEN environment variable
 * / secret manager entry - it is never accepted here or echoed back, so it's
 * never displayed in plain text after saving.
 */
export async function PUT(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const settings = await prisma.whatsAppSetting.upsert({
    where: { id: "singleton" },
    update: {
      provider: body?.provider,
      phoneNumberId: body?.phoneNumberId,
      businessAccountId: body?.businessAccountId,
      messageTemplate: body?.messageTemplate,
      automationEnabled: Boolean(body?.automationEnabled)
    },
    create: { id: "singleton" }
  });
  return NextResponse.json({ settings, status: getWhatsAppStatus() });
}
