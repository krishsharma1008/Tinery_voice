import { NextResponse, type NextRequest } from "next/server";
import { REALTIME_MODEL, REALTIME_SESSION_CONFIG } from "@/lib/realtime/config";
import { rateLimit } from "@/lib/realtime/rateLimit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const OPENAI_CLIENT_SECRETS_URL =
  "https://api.openai.com/v1/realtime/client_secrets";

function allowedOrigin(req: NextRequest): boolean {
  const origin = req.headers.get("origin");
  const host = req.headers.get("host");
  if (!origin) return true; // same-origin form posts and curl have no Origin
  try {
    const o = new URL(origin);
    if (host && o.host === host) return true;
  } catch {
    return false;
  }
  const extra = (process.env.ALLOWED_ORIGINS ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  return extra.includes(origin);
}

function clientIp(req: NextRequest): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0]!.trim();
  return req.headers.get("x-real-ip") ?? "local";
}

export async function POST(req: NextRequest) {
  if (!allowedOrigin(req)) {
    return NextResponse.json(
      { error: "origin_not_allowed" },
      { status: 403 },
    );
  }

  const limit = rateLimit(clientIp(req));
  if (!limit.ok) {
    return NextResponse.json(
      { error: "rate_limited", retry_after: limit.retryAfter },
      { status: 429, headers: { "Retry-After": String(limit.retryAfter ?? 60) } },
    );
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      {
        error: "missing_api_key",
        message:
          "Set OPENAI_API_KEY in .env.local. The key never reaches the browser; this server route mints a short-lived client_secret per call.",
      },
      { status: 503 },
    );
  }

  let upstream: Response;
  try {
    upstream = await fetch(OPENAI_CLIENT_SECRETS_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ session: REALTIME_SESSION_CONFIG }),
    });
  } catch (err) {
    console.error("[realtime] upstream fetch failed", err);
    return NextResponse.json(
      { error: "upstream_unreachable" },
      { status: 502 },
    );
  }

  const data = (await upstream.json().catch(() => null)) as
    | Record<string, unknown>
    | null;

  if (!upstream.ok || !data) {
    console.error("[realtime] upstream returned", upstream.status, data);
    return NextResponse.json(
      {
        error: "upstream_error",
        status: upstream.status,
        detail:
          (data && (data.error as { message?: string } | undefined)?.message) ??
          null,
      },
      { status: 502 },
    );
  }

  // Per PLAN §14.1: the new endpoint returns the ephemeral key under `value`.
  // Tolerate both old and new shapes so we don't break if the docs flip again.
  const clientSecret =
    typeof data.value === "string"
      ? (data.value as string)
      : (data.client_secret as { value?: string } | undefined)?.value;

  if (!clientSecret) {
    console.error("[realtime] response missing client secret", data);
    return NextResponse.json(
      { error: "no_client_secret_in_response" },
      { status: 502 },
    );
  }

  return NextResponse.json({
    client_secret: clientSecret,
    expires_at: data.expires_at ?? null,
    model: REALTIME_MODEL,
    session_id: data.id ?? null,
  });
}
