import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BRIDGE_URL = process.env.CALENDAR_BRIDGE_URL ?? "http://127.0.0.1:8765";

/**
 * Lightweight health pulse for the UI chip. Server-side fetch; the browser
 * never talks to the bridge directly. Returns the bridge status augmented
 * with `source_mode` from the env so the UI knows which path is configured.
 */
export async function GET() {
  const sourceMode = process.env.NEXT_PUBLIC_CALENDAR_MODE ?? "off";
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 2_000);
  try {
    const res = await fetch(`${BRIDGE_URL}/health`, {
      signal: ctrl.signal,
      cache: "no-store",
    });
    if (!res.ok) {
      return NextResponse.json({
        bridge: "down",
        source_mode: sourceMode,
        reason: `status_${res.status}`,
      });
    }
    const data = (await res.json()) as {
      ok?: boolean;
      signed_in?: boolean;
      has_openai_key?: boolean;
    };
    return NextResponse.json({
      bridge: data.ok ? "up" : "down",
      signed_in: !!data.signed_in,
      has_openai_key: !!data.has_openai_key,
      source_mode: sourceMode,
    });
  } catch (err) {
    return NextResponse.json({
      bridge: "down",
      source_mode: sourceMode,
      reason: err instanceof Error ? err.message : "unreachable",
    });
  } finally {
    clearTimeout(timer);
  }
}
