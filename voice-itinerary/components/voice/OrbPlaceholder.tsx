"use client";

import { Mic } from "lucide-react";

/**
 * Visual placeholder for the voice orb. Real interactive orb arrives in Phase 4 (Task #4).
 * Press is wired in Phase 2 once /api/realtime/session exists.
 */
export function OrbPlaceholder() {
  return (
    <button
      type="button"
      aria-label="Press to plan your trip with voice (coming online)"
      disabled
      className="group relative grid h-[220px] w-[220px] place-items-center rounded-full transition-transform focus-visible:outline-none disabled:cursor-progress"
      style={{ boxShadow: "var(--shadow-orb)" }}
    >
      <span
        aria-hidden
        className="absolute inset-0 rounded-full"
        style={{
          background:
            "radial-gradient(circle at 30% 25%, #f5a256 0%, #f08a2c 38%, #14536f 92%)",
        }}
      />
      <span
        aria-hidden
        className="absolute -inset-3 rounded-full border border-[color:var(--color-orange-300)]/50 motion-safe:animate-[breath_3.6s_ease-in-out_infinite]"
      />
      <span
        aria-hidden
        className="absolute -inset-7 rounded-full border border-[color:var(--color-orange-300)]/25 motion-safe:animate-[breath_5s_ease-in-out_infinite]"
      />
      <Mic className="relative h-12 w-12 text-white drop-shadow-md" strokeWidth={1.6} />

      <style>{`
        @keyframes breath {
          0%, 100% { transform: scale(1); opacity: 0.55; }
          50% { transform: scale(1.06); opacity: 0.85; }
        }
      `}</style>
    </button>
  );
}
