import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAdminSession } from "@/lib/auth";

export async function GET() {
  const settings = await prisma.siteSetting.upsert({
    where: { id: "singleton" },
    update: {},
    create: { id: "singleton" }
  });
  return NextResponse.json({ settings });
}

export async function PUT(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const settings = await prisma.siteSetting.upsert({
    where: { id: "singleton" },
    update: {
      websiteName: body?.websiteName,
      logoUrl: body?.logoUrl,
      primaryColorHex: body?.primaryColorHex,
      supportWhatsapp: body?.supportWhatsapp,
      supportEmail: body?.supportEmail
    },
    create: { id: "singleton", ...body }
  });
  return NextResponse.json({ settings });
}
