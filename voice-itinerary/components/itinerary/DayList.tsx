"use client";

import { motion } from "framer-motion";
import { Clock, Pin } from "lucide-react";
import { useItineraryStore } from "@/lib/store/itinerary";
import { getDestination } from "@/lib/data";
import { ActivityImage } from "./ActivityImage";

function dayHeader(iso: string, idx: number): string {
  const d = new Date(iso + "T00:00:00");
  const label = d.toLocaleDateString(undefined, {
    weekday: "long",
    month: "short",
    day: "numeric",
  });
  return `Day ${idx + 1} · ${label}`;
}

export function DayList() {
  const days = useItineraryStore((s) => s.days);
  const destinationId = useItineraryStore((s) => s.trip.destination_id);
  const dest = destinationId ? getDestination(destinationId) : null;

  if (days.length === 0) return null;

  return (
    <div className="flex flex-col gap-4">
      {days.map((day) => (
        <motion.section
          key={day.index}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.28, ease: "easeOut" }}
          className="rounded-[var(--radius-card)] border border-[color:var(--color-cream-200)] bg-white/75 p-5 shadow-[var(--shadow-soft)]"
        >
          <div className="mb-3 flex items-baseline justify-between">
            <h3 className="text-base font-semibold tracking-tight text-[color:var(--color-navy-900)]">
              {dayHeader(day.date, day.index)}
            </h3>
            <span className="text-[10px] uppercase tracking-[0.2em] text-[color:var(--color-ink-400)]">
              {day.mode}
            </span>
          </div>

          <ol className="flex flex-col gap-3">
            {day.fixed_events.length === 0 && day.activities.length === 0 && (
              <li className="text-sm italic text-[color:var(--color-ink-400)]">
                Open day — talk to fill it.
              </li>
            )}

            {day.fixed_events.map((ev) => (
              <li
                key={ev.id}
                className="flex items-center gap-3 rounded-xl bg-[color:var(--color-navy-900)] px-3 py-3 text-sm text-white"
              >
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-lg bg-white/10">
                  <Pin className="h-4 w-4" />
                </span>
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="flex items-baseline gap-2">
                    <span className="font-semibold tabular-nums">
                      {ev.start_time}
                    </span>
                    <span className="text-[10px] uppercase tracking-[0.18em] opacity-70">
                      {ev.type}
                    </span>
                  </span>
                  <span className="truncate text-sm opacity-95">{ev.title}</span>
                  {ev.location && (
                    <span className="truncate text-xs opacity-70">
                      {ev.location}
                    </span>
                  )}
                </span>
                <span className="hidden text-[10px] uppercase tracking-[0.16em] opacity-60 sm:inline">
                  {ev.duration_min}m
                </span>
              </li>
            ))}

            {day.activities.map((a) => {
              const catalog = a.catalog_id
                ? dest?.activities.find((x) => x.id === a.catalog_id) ??
                  dest?.food.find((x) => x.id === a.catalog_id)
                : undefined;
              return (
                <li
                  key={a.id}
                  className="flex items-center gap-3 rounded-xl bg-[color:var(--color-cream-100)]/60 px-3 py-3 text-sm text-[color:var(--color-navy-900)] hover:bg-[color:var(--color-cream-100)]"
                >
                  <ActivityImage
                    destinationId={destinationId}
                    seed={a.id}
                    kind={catalog?.kind ?? "activity"}
                    tags={catalog?.tags}
                    size="sm"
                  />
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="flex items-baseline gap-2">
                      <Clock className="h-3 w-3 opacity-50" />
                      <span className="font-semibold tabular-nums">
                        {a.start_time}
                      </span>
                      {a.area_id && (
                        <span className="rounded-full bg-white/70 px-2 py-[1px] text-[10px] uppercase tracking-[0.14em] text-[color:var(--color-ink-400)]">
                          {a.area_id}
                        </span>
                      )}
                    </span>
                    <span className="truncate text-sm">{a.title}</span>
                    {a.notes && (
                      <span className="truncate text-xs italic text-[color:var(--color-ink-400)]">
                        {a.notes}
                      </span>
                    )}
                  </span>
                  <span className="text-[10px] uppercase tracking-[0.16em] text-[color:var(--color-ink-400)]">
                    {a.duration_min}m
                  </span>
                </li>
              );
            })}
          </ol>
        </motion.section>
      ))}
    </div>
  );
}
