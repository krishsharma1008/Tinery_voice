"use client";

import { motion, AnimatePresence } from "framer-motion";
import { MapPin, Plane, Users } from "lucide-react";
import { useItineraryStore } from "@/lib/store/itinerary";
import { getDestination } from "@/lib/data";
import { heroGradientStyle } from "@/lib/images/gradient";

function formatDateRange(start: string | null, end: string | null): string {
  if (!start || !end) return "";
  const s = new Date(start + "T00:00:00");
  const e = new Date(end + "T00:00:00");
  const fmt = (d: Date) =>
    d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  return `${fmt(s)} – ${fmt(e)}`;
}

export function TripHeader() {
  const trip = useItineraryStore((s) => s.trip);
  if (!trip.destination_name) return null;

  const range = formatDateRange(trip.start_date, trip.end_date);
  const days = useItineraryStore.getState().days.length;
  const dest = trip.destination_id ? getDestination(trip.destination_id) : null;

  return (
    <AnimatePresence>
      <motion.div
        key={trip.destination_id ?? "x"}
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.34, ease: "easeOut" }}
        className="relative overflow-hidden rounded-[var(--radius-card)] border border-[color:var(--color-cream-200)] shadow-[var(--shadow-soft)]"
      >
        <div
          aria-hidden
          className="absolute inset-0"
          style={heroGradientStyle(trip.destination_id)}
        />
        <div className="relative px-6 py-6 sm:px-7 sm:py-8">
          <div className="flex items-baseline gap-2 text-[10px] uppercase tracking-[0.18em] text-white/80">
            <Plane className="h-3 w-3" />
            <span>{dest?.airport_code ?? ""}</span>
            <span aria-hidden>·</span>
            <span>{dest?.country ?? ""}</span>
          </div>
          <h2
            className="mt-1 text-3xl font-semibold leading-tight tracking-tight text-white drop-shadow-sm sm:text-4xl"
            style={{ textShadow: "0 1px 6px rgba(14,63,92,0.25)" }}
          >
            {trip.destination_name}
          </h2>
          <p
            className="mt-1 text-sm text-white/90 sm:text-base"
            style={{ textShadow: "0 1px 4px rgba(14,63,92,0.2)" }}
          >
            {range && (
              <>
                {range} · {days} day{days === 1 ? "" : "s"}
              </>
            )}
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/85 px-2.5 py-1 text-xs font-medium text-[color:var(--color-navy-900)] backdrop-blur-sm">
              <Users className="h-3 w-3" />
              {trip.travelers} traveler{trip.travelers === 1 ? "" : "s"}
            </span>
            {trip.vibe && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/85 px-2.5 py-1 text-xs font-medium capitalize text-[color:var(--color-navy-900)] backdrop-blur-sm">
                <MapPin className="h-3 w-3" />
                {trip.vibe}
              </span>
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
