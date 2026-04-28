import { NextResponse, type NextRequest } from "next/server";
import { MOCK_EVENTS, eventsBetween } from "@/lib/calendar/mock";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BRIDGE_URL =
  process.env.CALENDAR_BRIDGE_URL ?? "http://127.0.0.1:8765";
const BRIDGE_TIMEOUT_MS = 20_000;

/**
 * Calendar source resolution (PLAN §16):
 *   ?source=mock          → always mock fixture
 *   ?source=browser_use   → try the local bridge; on any failure, fall back to mock
 *   else                  → NEXT_PUBLIC_CALENDAR_MODE env: same options
 *   else                  → empty list (calendar awareness off)
 *
 * Falls back silently to the mock fixture so the demo conversation never
 * stalls on a bridge outage.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const source =
    searchParams.get("source") ??
    process.env.NEXT_PUBLIC_CALENDAR_MODE ??
    "off";
  const start = searchParams.get("start");
  const end = searchParams.get("end");

  if (source === "browser_use") {
    const result = await fetchFromBridge(start, end);
    if (result.ok) {
      return NextResponse.json({
        source: "browser_use",
        events: result.events,
        cached: result.cached ?? false,
        signed_in: true,
      });
    }
    // Auto-fallback so the demo never breaks.
    const events = start && end ? eventsBetween(start, end) : MOCK_EVENTS;
    return NextResponse.json({
      source: "mock_fallback",
      events,
      fell_back: true,
      reason: result.reason,
    });
  }

  if (source === "mock") {
    const events = start && end ? eventsBetween(start, end) : MOCK_EVENTS;
    return NextResponse.json({ source: "mock", events });
  }

  return NextResponse.json({
    source: "off",
    events: [],
    note: "Calendar awareness disabled. Set ?source=mock or ?source=browser_use.",
  });
}

async function fetchFromBridge(
  start: string | null,
  end: string | null,
): Promise<
  | { ok: true; events: unknown[]; cached?: boolean }
  | { ok: false; reason: string }
> {
  if (!start || !end) {
    return { ok: false, reason: "missing_date_range" };
  }
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), BRIDGE_TIMEOUT_MS);
  try {
    const res = await fetch(`${BRIDGE_URL}/events`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ start, end }),
      signal: ctrl.signal,
    });
    if (!res.ok) {
      return { ok: false, reason: `bridge_status_${res.status}` };
    }
    const data = (await res.json()) as {
      ok?: boolean;
      events?: unknown[];
      cached?: boolean;
      reason?: string;
    };
    if (!data.ok) return { ok: false, reason: data.reason ?? "bridge_failed" };
    return { ok: true, events: data.events ?? [], cached: data.cached };
  } catch (err) {
    return {
      ok: false,
      reason: err instanceof Error ? err.message : "bridge_unreachable",
    };
  } finally {
    clearTimeout(timer);
  }
}

/**
 * GET /api/calendar/health → mirrors the bridge's /health for the UI chip.
 * Public so the client can check status without exposing the key.
 */
export async function HEAD() {
  return new NextResponse(null, { status: 200 });
}
