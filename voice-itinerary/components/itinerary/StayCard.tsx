"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Star, Wifi } from "lucide-react";
import { useItineraryStore } from "@/lib/store/itinerary";
import { ActivityImage } from "./ActivityImage";

const TIER_DOTS: Record<string, number> = {
  backpack: 1,
  comfort: 2,
  premium: 3,
  luxury: 4,
};

export function StayCard() {
  const stay = useItineraryStore((s) => s.stay);
  const trip = useItineraryStore((s) => s.trip);
  if (!stay || !stay.area_id) return null;
  const dots = TIER_DOTS[stay.tier ?? "comfort"] ?? 2;

  return (
    <AnimatePresence>
      <motion.div
        key={stay.property_id ?? stay.area_id}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.34 }}
        className="flex items-center gap-4 rounded-[var(--radius-card)] border border-[color:var(--color-cream-200)] bg-white/80 p-4 shadow-[var(--shadow-soft)]"
      >
        <ActivityImage
          destinationId={trip.destination_id}
          seed={stay.property_id ?? stay.area_id}
          kind="stay"
          tags={["stay"]}
          size="md"
        />
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex items-baseline gap-2">
            <h3 className="truncate text-base font-semibold tracking-tight text-[color:var(--color-navy-900)]">
              {stay.name ?? "Stay"}
            </h3>
            <span className="text-xs uppercase tracking-[0.16em] text-[color:var(--color-ink-400)]">
              {stay.area_id}
            </span>
          </div>
          {stay.blurb && (
            <p className="mt-1 line-clamp-2 text-xs leading-5 text-[color:var(--color-ink-600)]">
              {stay.blurb}
            </p>
          )}
          <div className="mt-2 flex items-center gap-2 text-[10px] uppercase tracking-[0.16em] text-[color:var(--color-ink-400)]">
            <span className="inline-flex items-center gap-0.5">
              {Array.from({ length: 4 }).map((_, i) => (
                <Star
                  key={i}
                  className={`h-2.5 w-2.5 ${
                    i < dots
                      ? "fill-[color:var(--color-orange-500)] text-[color:var(--color-orange-500)]"
                      : "text-[color:var(--color-cream-200)]"
                  }`}
                  strokeWidth={1}
                />
              ))}
            </span>
            <span aria-hidden>·</span>
            <span>day {stay.check_in_day + 1} → day {stay.check_out_day + 1}</span>
            <Wifi className="ml-auto h-3 w-3 text-[color:var(--color-success)]" />
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
