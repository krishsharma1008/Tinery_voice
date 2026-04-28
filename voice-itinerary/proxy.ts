import { NextResponse, type NextRequest } from "next/server";

/**
 * CSP per PLAN §14.5. Tight on script/style; allows the WebRTC + SDP traffic
 * to OpenAI. `'unsafe-inline'` on style is needed for Next.js style injection
 * and Tailwind's runtime-emitted utilities. `'unsafe-eval'` is added in dev
 * only — React + Next + Turbopack dev mode all use eval() for HMR and stack
 * reconstruction; production builds never need it.
 */
const isDev = process.env.NODE_ENV !== "production";
const scriptSrc = isDev
  ? "script-src 'self' 'unsafe-inline' 'unsafe-eval'"
  : "script-src 'self' 'unsafe-inline'";

const CSP = [
  "default-src 'self'",
  "connect-src 'self' https://api.openai.com wss://api.openai.com",
  "media-src 'self' blob:",
  "img-src 'self' data: blob: https://images.unsplash.com",
  scriptSrc,
  "style-src 'self' 'unsafe-inline'",
  "font-src 'self' data:",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join("; ");

export function proxy(_req: NextRequest) {
  const res = NextResponse.next();
  res.headers.set("Content-Security-Policy", CSP);
  res.headers.set("Permissions-Policy", "microphone=(self), camera=()");
  res.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  res.headers.set("X-Content-Type-Options", "nosniff");
  return res;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
