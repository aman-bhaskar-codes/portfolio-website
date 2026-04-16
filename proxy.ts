import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function proxy(req: NextRequest) {
    // Target paths that require absolute OWNER protection
    const isAdminRoute = req.nextUrl.pathname.startsWith("/admin");
    const isProtectedApi = req.nextUrl.pathname.startsWith("/api/admin");

    if (isAdminRoute || isProtectedApi) {
        const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

        // 1. Kick unauthenticated users
        if (!token) {
            return NextResponse.redirect(new URL("/api/auth/signin", req.url));
        }

        // 2. Strong RBAC Enforcement
        if (token.role !== "OWNER") {
            console.warn(`[MIDDLEWARE] Unauthorized access attempt to ${req.nextUrl.pathname} by User: ${token.email}`);
            return new NextResponse(
                JSON.stringify({ error: "Access Denied. Cognitive privilege level: OWNER required." }),
                { status: 403, headers: { "Content-Type": "application/json" } }
            );
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: ["/admin/:path*", "/api/admin/:path*"],
};
