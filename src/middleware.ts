import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// Graceful fallback if UPSTASH is not configured
const ratelimit = (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN)
  ? new Ratelimit({
    redis: Redis.fromEnv(),
    limiter: Ratelimit.slidingWindow(10, "10 s"), // 10 requests per 10 seconds per IP
    analytics: false,
  })
  : null;

export default withAuth(
  async function middleware(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;

    // Basic API Rate Limiting Defense
    if (ratelimit && path.startsWith("/api")) {
      const ip = req.ip || "127.0.0.1";
      const { success } = await ratelimit.limit(ip);
      if (!success) {
        return NextResponse.json(
          { error: "Too Many Requests. Please slow down." },
          { status: 429 }
        );
      }
    }

    // Admin routes - only system_admin
    if (path.startsWith("/admin")) {
      if (token?.role !== "system_admin") {
        // Redirect agency_admin and others to agency dashboard
        return NextResponse.redirect(new URL("/agency/dashboard", req.url));
      }
    }

    // Agency routes - any authenticated user
    if (path.startsWith("/agency")) {
      // Allow public access to quote pages with a token
      if (path.startsWith("/agency/quote/") && req.nextUrl.searchParams.has("token")) {
        return NextResponse.next();
      }

      if (!token) {
        return NextResponse.redirect(new URL("/signin", req.url));
      }
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        // Allow access to public routes
        if (req.nextUrl.pathname.startsWith("/api/auth")) {
          return true;
        }

        // Allow public access to quote pages with a token
        if (req.nextUrl.pathname.startsWith("/agency/quote/") && req.nextUrl.searchParams.has("token")) {
          return true;
        }

        // Protect /agency and /admin routes
        if (req.nextUrl.pathname.startsWith("/agency") || req.nextUrl.pathname.startsWith("/admin")) {
          return !!token;
        }

        return true;
      },
    },
  }
);

export const config = {
  matcher: [
    "/agency/:path*",
    "/admin/:path*",
    "/api/:path*",
  ],
};

