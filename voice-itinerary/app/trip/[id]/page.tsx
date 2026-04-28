import { headers } from "next/headers";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, CalendarPlus, Compass, Printer } from "lucide-react";
import { EditableTripCanvas } from "@/components/itinerary/EditableTripCanvas";

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

export default async function TripPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const snap = await fetchTrip(id);
  if (!snap) notFound();

  return (
    <section className="mx-auto w-full max-w-4xl flex-1 px-5 py-8 sm:px-8">
      <nav className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-medium uppercase tracking-[0.16em] text-[color:var(--color-ink-400)] transition-colors hover:text-[color:var(--color-navy-900)]"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          plan another
        </Link>
        <div className="flex items-center gap-2 text-[color:var(--color-navy-900)]">
          <a
            href={`/trip/${id}/print`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-full border border-[color:var(--color-cream-200)] bg-white/70 px-3 py-1.5 text-xs font-medium transition-colors hover:bg-white"
          >
            <Printer className="h-3.5 w-3.5" />
            print / pdf
          </a>
          <a
            href={`/api/export/${id}/ics`}
            className="inline-flex items-center gap-1.5 rounded-full border border-[color:var(--color-cream-200)] bg-white/70 px-3 py-1.5 text-xs font-medium transition-colors hover:bg-white"
          >
            <CalendarPlus className="h-3.5 w-3.5" />
            add to calendar
          </a>
          <span className="hidden items-center gap-1.5 text-[10px] uppercase tracking-[0.18em] text-[color:var(--color-ink-400)] sm:inline-flex">
            <Compass className="h-3 w-3" />
            made with tineri voice
          </span>
        </div>
      </nav>

      <EditableTripCanvas snapshot={snap} />
    </section>
  );
}
