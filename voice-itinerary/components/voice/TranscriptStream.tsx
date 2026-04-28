"use client";

import { useEffect, useRef } from "react";
import { useVoiceStore } from "@/lib/store/voice";

export function TranscriptStream() {
  const turns = useVoiceStore((s) => s.transcript);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (ref.current) ref.current.scrollTop = ref.current.scrollHeight;
  }, [turns]);

  if (turns.length === 0) return null;

  return (
    <div
      ref={ref}
      className="max-h-[180px] overflow-y-auto rounded-2xl border border-[color:var(--color-cream-200)] bg-white/60 p-3 text-sm leading-relaxed"
    >
      <ul className="flex flex-col gap-1.5">
        {turns.slice(-10).map((t) => (
          <li key={t.id} className="flex gap-2">
            <span
              className={`shrink-0 text-[10px] uppercase tracking-[0.18em] ${
                t.role === "user"
                  ? "text-[color:var(--color-orange-500)]"
                  : "text-[color:var(--color-navy-700)]"
              }`}
            >
              {t.role === "user" ? "you" : "tineri"}
            </span>
            <span className="text-[color:var(--color-ink-900)]">{t.text}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
