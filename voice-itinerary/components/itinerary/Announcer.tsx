"use client";

import { useEffect, useRef } from "react";
import { useItineraryStore } from "@/lib/store/itinerary";

/**
 * PLAN §14.7: every store mutation should be spoken to assistive tech.
 * Subscribes to selective slices of the store and updates the aria-live
 * region in app/layout.tsx. Visual users hear the model and see the canvas;
 * screen-reader users get the same beats in plain English.
 */
export function Announcer() {
  const lastTripRef = useRef<string>("");
  const lastDaysRef = useRef<number>(0);
  const lastFinalizedRef = useRef<boolean>(false);

  useEffect(() => {
    return useItineraryStore.subscribe((s) => {
      const node =
        typeof document !== "undefined"
          ? (document.getElementById("trip-announcer") as HTMLElement | null)
          : null;
      if (!node) return;

      const tripKey = `${s.trip.destination_id ?? ""}|${s.trip.start_date ?? ""}|${s.trip.end_date ?? ""}|${s.trip.travelers}`;
      if (tripKey !== lastTripRef.current && s.trip.destination_name) {
        node.textContent = `Trip set to ${s.trip.destination_name} for ${s.days.length} days, ${s.trip.travelers} traveler${
          s.trip.travelers === 1 ? "" : "s"
        }.`;
        lastTripRef.current = tripKey;
        return;
      }

      if (s.days.length !== lastDaysRef.current) {
        lastDaysRef.current = s.days.length;
      }

      if (s.status === "finalized" && !lastFinalizedRef.current) {
        node.textContent = "Trip finalized. Share link copied to clipboard.";
        lastFinalizedRef.current = true;
        return;
      }
      if (s.status !== "finalized" && lastFinalizedRef.current) {
        lastFinalizedRef.current = false;
      }
    });
  }, []);

  return null;
}
