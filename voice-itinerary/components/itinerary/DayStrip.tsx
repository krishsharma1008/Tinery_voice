"use client";

import { motion } from "framer-motion";
import { useItineraryStore, type DayMode } from "@/lib/store/itinerary";

const MODE_STYLE: Record<DayMode, { label: string; classes: string }> = {
  work: {
    label: "work",
    classes: "bg-[color:var(--color-navy-900)] text-white",
  },
  leisure: {
    label: "leisure",
    classes:
      "bg-[color:var(--color-cream-100)] text-[color:var(--color-navy-900)]",
  },
  travel: {
    label: "travel",
    classes:
      "bg-[color:var(--color-orange-300)] text-[color:var(--color-navy-900)]",
  },
  chill: {
    label: "chill",
    classes:
      "bg-gradient-to-br from-[color:var(--color-cream-100)] to-[color:var(--color-orange-300)] text-[color:var(--color-navy-900)]",
  },
  adventure: {
    label: "adventure",
    classes: "bg-[color:var(--color-orange-500)] text-white",
  },
};

function dayLabel(iso: string): string {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString(undefined, {
    weekday: "short",
    day: "numeric",
  });
}

export function DayStrip() {
  const days = useItineraryStore((s) => s.days);
  if (days.length === 0) return null;

  return (
    <div className="flex flex-nowrap items-stretch gap-3 overflow-x-auto pb-2">
      {days.map((day, i) => {
        const style = MODE_STYLE[day.mode] ?? MODE_STYLE.leisure;
        return (
          <motion.div
            key={day.index}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{
              delay: i * 0.06,
              duration: 0.28,
              ease: "easeOut",
            }}
            className={`shrink-0 rounded-2xl border border-[color:var(--color-cream-200)] px-4 py-3 ${style.classes}`}
          >
            <div className="text-[10px] uppercase tracking-[0.18em] opacity-80">
              day {day.index + 1}
            </div>
            <div className="mt-0.5 text-sm font-semibold">
              {dayLabel(day.date)}
            </div>
            <div className="mt-1 text-[11px] uppercase tracking-[0.16em] opacity-90">
              {style.label}
            </div>
            <div className="mt-1 flex items-center gap-1 text-[10px] opacity-80">
              {day.fixed_events.length > 0 && (
                <span title="fixed event">📌 {day.fixed_events.length}</span>
              )}
              {day.activities.length > 0 && (
                <span title="activities">{day.activities.length} acts</span>
              )}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
