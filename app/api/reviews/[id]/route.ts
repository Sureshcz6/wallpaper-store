import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAdminSession } from "@/lib/auth";

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const allowed = ["APPROVED", "REJECTED", "PENDING"];
  const data: any = {};
  if (body?.status && allowed.includes(body.status)) data.status = body.status;
  if (typeof body?.isFeatured === "boolean") data.isFeatured = body.isFeatured;

  const review = await prisma.review.update({ where: { id: params.id }, data });
  return NextResponse.json({ review });
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await prisma.review.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true });
}
