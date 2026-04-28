"use client";

import { useEffect, useRef } from "react";
import { TripView } from "./TripView";
import { VoiceOrb } from "@/components/voice/VoiceOrb";
import { useItineraryStore } from "@/lib/store/itinerary";

type Snapshot = {
  share_id: string;
  saved_at: number;
  payload: unknown;
};

type StorePayload = {
  trip: ReturnType<typeof useItineraryStore.getState>["trip"];
  days: ReturnType<typeof useItineraryStore.getState>["days"];
  stay: ReturnType<typeof useItineraryStore.getState>["stay"];
  preferences: ReturnType<typeof useItineraryStore.getState>["preferences"];
  parking_lot: ReturnType<typeof useItineraryStore.getState>["parking_lot"];
  status: ReturnType<typeof useItineraryStore.getState>["status"];
};

/**
 * Read-with-voice-edit canvas for /trip/[id]. Hydrates the Zustand store from
 * the server-fetched snapshot, renders TripView off the *live* store so voice
 * edits show up instantly, and mounts the VoiceOrb in FAB mode bottom-right.
 *
 * Mutations debounce-save back to /api/share with the same share_id; last
 * write wins (acceptable for the demo).
 */
export function EditableTripCanvas({ snapshot }: { snapshot: Snapshot }) {
  const trip = useItineraryStore((s) => s.trip);
  const days = useItineraryStore((s) => s.days);
  const stay = useItineraryStore((s) => s.stay);
  const preferences = useItineraryStore((s) => s.preferences);
  const parking_lot = useItineraryStore((s) => s.parking_lot);
  const status = useItineraryStore((s) => s.status);
  const share_id = useItineraryStore((s) => s.share_id);

  const hydratedRef = useRef(false);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Hydrate once from the server snapshot. Skipping on subsequent renders so
  // voice edits aren't clobbered.
  useEffect(() => {
    if (hydratedRef.current) return;
    hydratedRef.current = true;
    const payload = (snapshot.payload ?? {}) as Partial<StorePayload>;
    useItineraryStore.getState().hydrate({
      trip: payload.trip ?? undefined,
      days: payload.days ?? undefined,
      stay: payload.stay ?? null,
      preferences: payload.preferences ?? {},
      parking_lot: payload.parking_lot ?? [],
      status: "finalized",
      share_id: snapshot.share_id,
    } as Parameters<ReturnType<typeof useItineraryStore.getState>["hydrate"]>[0]);
  }, [snapshot]);

  // Debounced save loop: any change to the slice we render → POST /api/share.
  useEffect(() => {
    if (!hydratedRef.current || !share_id) return;
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      void fetch("/api/share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          share_id,
          payload: { trip, days, stay, preferences, parking_lot, status },
        }),
      });
    }, 1500);
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [trip, days, stay, preferences, parking_lot, status, share_id]);

  // Build a snapshot-shaped object from the live store so TripView re-renders
  // on every voice edit without needing snapshot-prop rewrites.
  const liveSnapshot = {
    share_id: snapshot.share_id,
    saved_at: snapshot.saved_at,
    payload: { trip, days, stay, preferences, parking_lot, status },
  };

  return (
    <>
      <TripView snapshot={liveSnapshot} />
      <VoiceOrb variant="fab" />
    </>
  );
}
