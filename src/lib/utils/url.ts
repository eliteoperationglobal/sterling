import { signOut as nextAuthSignOut } from "next-auth/react";

/**
 * Helper to get the canonical base URL for the application.
 * Priority:
 * 1. In browser environment: window.location.origin
 * 2. NEXT_PUBLIC_SITE_URL or NEXT_PUBLIC_APP_URL or NEXTAUTH_URL
 * 3. Default fallback: http://localhost:3000
 */
export function getBaseUrl(): string {
  if (typeof window !== "undefined") {
    return window.location.origin;
  }
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");
  }
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "");
  }
  if (process.env.NEXTAUTH_URL) {
    return process.env.NEXTAUTH_URL.replace(/\/$/, "");
  }
  return "http://localhost:3000";
}

/**
 * Robust sign-out handler that forces relative or explicit host origin callback URLs
 * to prevent NextAuth from defaulting to localhost:3000 on production/VPS.
 */
export function handleSignOut(callbackUrl: string = "/signin") {
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const targetUrl = callbackUrl.startsWith("/") ? `${origin}${callbackUrl}` : callbackUrl;
  return nextAuthSignOut({ callbackUrl: targetUrl });
}
