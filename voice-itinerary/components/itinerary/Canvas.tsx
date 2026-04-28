"use client";

import { useItineraryStore } from "@/lib/store/itinerary";
import { VoiceOrb } from "@/components/voice/VoiceOrb";
import { TranscriptStream } from "@/components/voice/TranscriptStream";
import { TripHeader } from "./TripHeader";
import { DayStrip } from "./DayStrip";
import { DayList } from "./DayList";
import { EmptyState } from "./EmptyState";
import { Announcer } from "./Announcer";
import { ShareBar } from "./ShareBar";
import { StayCard } from "./StayCard";

export function Canvas() {
  const status = useItineraryStore((s) => s.status);

  if (status === "empty")
    return (
      <>
        <Announcer />
        <EmptyState />
      </>
    );

  // status === "draft" or "finalized" — show the live itinerary canvas.
  return (
    <section className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-5 px-5 py-6 sm:px-8 lg:flex-row">
      <aside className="flex w-full shrink-0 flex-col items-center gap-5 lg:sticky lg:top-20 lg:w-[300px] lg:self-start">
        <VoiceOrb />
        <TranscriptStream />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col gap-4">
        <TripHeader />
        <ShareBar />
        <StayCard />
        <DayStrip />
        <DayList />
      </div>

      <Announcer />
    </section>
  );
}
