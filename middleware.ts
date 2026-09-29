import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

// Edge-safe re-check of the admin cookie. Every /admin page (except the
// login page) and every /api/admin/* route must present a valid session.
const PUBLIC_ADMIN_PATHS = ["/admin/login"];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const isAdminArea = pathname.startsWith("/admin") && !PUBLIC_ADMIN_PATHS.includes(pathname);
  const isAdminApi = pathname.startsWith("/api/admin") && pathname !== "/api/admin/login";

  if (!isAdminArea && !isAdminApi) {
    return NextResponse.next();
  }

  const token = req.cookies.get("admin_session")?.value;
  const secret = process.env.ADMIN_SESSION_SECRET;

  if (!token || !secret) {
    return denyAccess(req, isAdminApi);
  }

  try {
    await jwtVerify(token, new TextEncoder().encode(secret));
    return NextResponse.next();
  } catch {
    return denyAccess(req, isAdminApi);
  }
}

function denyAccess(req: NextRequest, isApi: boolean) {
  if (isApi) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const loginUrl = new URL("/admin/login", req.url);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"]
};
