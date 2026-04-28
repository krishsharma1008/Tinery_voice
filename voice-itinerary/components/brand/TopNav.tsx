import Link from "next/link";
import { Compass } from "lucide-react";
import { CalendarChip } from "@/components/calendar/CalendarChip";
import { SettingsSheet } from "./SettingsSheet";

export function TopNav() {
  return (
    <header className="print-hide sticky top-0 z-30 border-b border-[color:var(--color-cream-200)]/60 bg-[color:var(--color-cream-50)]/85 backdrop-blur supports-[backdrop-filter]:bg-[color:var(--color-cream-50)]/65">
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between px-5 sm:px-8">
        <Link href="/" className="group flex items-baseline gap-2">
          <span
            className="text-3xl leading-none text-[color:var(--color-orange-500)] transition-transform group-hover:-rotate-1"
            style={{ fontFamily: "var(--font-script)" }}
          >
            Tineri
          </span>
          <span className="hidden text-[10px] font-medium uppercase tracking-[0.18em] text-[color:var(--color-ink-400)] sm:inline">
            voice
          </span>
        </Link>

        <div className="flex items-center gap-3 text-[color:var(--color-navy-700)]">
          <CalendarChip />
          <a
            href="https://opendestinations.com"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden items-center gap-2 rounded-full border border-[color:var(--color-cream-200)] bg-white/60 px-3 py-1.5 text-xs font-medium text-[color:var(--color-navy-900)] transition-colors hover:bg-white sm:inline-flex"
            aria-label="Powered by Open Destinations"
          >
            <Compass className="h-3.5 w-3.5 text-[color:var(--color-navy-700)]" />
            <span className="leading-none">
              <span className="text-[10px] uppercase tracking-[0.16em] text-[color:var(--color-ink-400)]">
                by
              </span>{" "}
              <span>open destinations</span>
            </span>
          </a>
          <SettingsSheet />
        </div>
      </div>
    </header>
  );
}
