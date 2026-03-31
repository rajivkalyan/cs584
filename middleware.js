import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";

const protectedPaths = ["/", "/voice", "/patients", "/history"];

function isProtected(pathname) {
  if (!pathname) return false;
  return protectedPaths.some(
    (p) => pathname === p || (p !== "/" && pathname.startsWith(p))
  );
}

export async function middleware(request) {
  const { pathname } = request.nextUrl;
  if (pathname.startsWith("/api/auth")) return NextResponse.next();
  if (!isProtected(pathname)) return NextResponse.next();

  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  if (!token) {
    const login = new URL("/login", request.url);
    login.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(login);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
