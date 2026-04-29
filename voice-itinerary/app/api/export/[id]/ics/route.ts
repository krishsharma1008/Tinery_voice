import { NextResponse } from "next/server";
import { getSharedTrip } from "@/lib/share/store";
import { buildIcs, suggestedFilename, type IcsPayload } from "@/lib/share/ics";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/export/<share_id>/ics — streams the trip's calendar file.
 * Returns 404 if the share has not been persisted yet.
 */
export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  const snap = getSharedTrip(id);
  if (!snap) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  const payload = snap.payload as IcsPayload;
  if (!payload?.trip || !Array.isArray(payload?.days)) {
    return NextResponse.json({ error: "bad_payload" }, { status: 422 });
  }
  const ics = buildIcs(id, payload);
  return new NextResponse(ics, {
    status: 200,
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="${suggestedFilename(payload)}"`,
      "Cache-Control": "no-store",
    },
  });
}
