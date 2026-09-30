import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { productSchema } from "@/lib/validation";
import { getAdminSession } from "@/lib/auth";
import { serializeProduct } from "@/lib/product-serializer";