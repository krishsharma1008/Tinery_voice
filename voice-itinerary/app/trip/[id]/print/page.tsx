import { headers } from "next/headers";
import { TripView } from "@/components/itinerary/TripView";
import { PrintAutoOpen } from "./PrintAutoOpen";

type Snapshot = {
  share_id: string;
  saved_at: number;
  payload: unknown;
};

async function fetchTrip(id: string): Promise<Snapshot | null> {
  const h = await headers();
  const host = h.get("host");
  const proto = h.get("x-forwarded-proto") ?? "http";
  if (!host) return null;
  const res = await fetch(`${proto}://${host}/api/share/${id}`, {
    cache: "no-store",
  });
  if (!res.ok) return null;
  return (await res.json()) as Snapshot;
}

/**
 * Print-friendly trip view. Lives at /trip/[id]/print so the user can either
 * navigate from the share bar or be opened by the open_print voice tool.
 * The OS print dialog is the "save as PDF" path — no @react-pdf/renderer
 * dependency is needed (incompatible with React 19, see PLAN §15.2 note).
 */
export default async function TripPrintPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const snap = await fetchTrip(id);
  if (!snap) {
    return (
      <main className="mx-auto w-full max-w-3xl px-6 py-12">
        <h1 className="text-2xl font-semibold text-[color:var(--color-navy-900)]">
          This itinerary is no longer saved.
        </h1>
        <p className="mt-3 text-sm text-[color:var(--color-ink-600)]">
          Return to the planner and finalize the trip again.
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-6">
      <PrintAutoOpen />
      <TripView snapshot={snap} printMode />
    </main>
  );
}
