import { NextResponse, type NextRequest } from "next/server";
import { shareStore } from "@/lib/share/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** POST /api/share — body is { share_id, payload }. Idempotent on share_id. */
export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => null)) as
    | { share_id?: string; payload?: unknown }
    | null;
  if (!body?.share_id || !body.payload) {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }
  shareStore.set(body.share_id, {
    share_id: body.share_id,
    saved_at: Date.now(),
    payload: body.payload,
  });
  return NextResponse.json({ ok: true, share_id: body.share_id });
}
