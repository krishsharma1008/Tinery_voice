"use client";

import { useEffect, useState } from "react";
import { Calendar, Cloud, CloudOff } from "lucide-react";

type Health = {
  bridge: "up" | "down";
  signed_in?: boolean;
  source_mode: "off" | "mock" | "browser_use" | string;
  reason?: string;
};

/**
 * Shows the user where calendar context is coming from. Three states:
 *  - off  → no chip
 *  - mock → cream chip "demo calendar"
 *  - browser_use up + signed_in → green chip "calendar · live"
 *  - browser_use up + signed out → amber chip "calendar · sign in"
 *  - browser_use down → grey chip "calendar · offline" with mock fallback note
 */
export function CalendarChip() {
  const [health, setHealth] = useState<Health | null>(null);

  useEffect(() => {
    let cancel = false;
    const tick = async () => {
      try {
        const res = await fetch("/api/calendar/health", { cache: "no-store" });
        const data = (await res.json()) as Health;
        if (!cancel) setHealth(data);
      } catch {
        if (!cancel)
          setHealth({ bridge: "down", source_mode: "off" });
      }
    };
    void tick();
    const id = setInterval(tick, 12_000);
    return () => {
      cancel = true;
      clearInterval(id);
    };
  }, []);

  if (!health || health.source_mode === "off") return null;

  if (health.source_mode === "mock") {
    return (
      <Pill tone="cream" Icon={Calendar}>
        demo calendar · mock fixture
      </Pill>
    );
  }

  if (health.source_mode === "browser_use") {
    if (health.bridge === "up" && health.signed_in)
      return (
        <Pill tone="green" Icon={Cloud}>
          calendar · live (browser-use)
        </Pill>
      );
    if (health.bridge === "up" && !health.signed_in)
      return (
        <Pill tone="amber" Icon={Cloud}>
          calendar · run pnpm calendar:setup
        </Pill>
      );
    return (
      <Pill tone="grey" Icon={CloudOff}>
        calendar · bridge offline · mock fallback
      </Pill>
    );
  }

  return null;
}

function Pill({
  tone,
  Icon,
  children,
}: {
  tone: "green" | "amber" | "grey" | "cream";
  Icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) {
  const palette: Record<typeof tone, string> = {
    green:
      "bg-[color:var(--color-success)]/10 text-[color:var(--color-success)] border-[color:var(--color-success)]/30",
    amber:
      "bg-[color:var(--color-orange-300)]/30 text-[color:var(--color-navy-900)] border-[color:var(--color-orange-300)]/60",
    grey:
      "bg-[color:var(--color-cream-100)] text-[color:var(--color-ink-600)] border-[color:var(--color-cream-200)]",
    cream:
      "bg-[color:var(--color-cream-100)] text-[color:var(--color-navy-700)] border-[color:var(--color-cream-200)]",
  };
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium ${palette[tone]}`}
    >
      <Icon className="h-3 w-3" />
      {children}
    </span>
  );
}
