/**
 * Date table generator. The realtime model used to do date arithmetic
 * itself and got "Thursday" wrong by one day. We now inject a 30-day
 * lookup table into the system prompt so the model can read off the
 * weekday → date mapping instead of computing.
 *
 * Used as the secondary safety net (the primary is set_trip_basics
 * dispatcher validation that rejects any weekday/date mismatch).
 */

const SHORT_WEEKDAYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"] as const;

export type ShortWeekday = (typeof SHORT_WEEKDAYS)[number];

const FULL_TO_SHORT: Record<string, ShortWeekday> = {
  sunday: "sun",
  monday: "mon",
  tuesday: "tue",
  wednesday: "wed",
  thursday: "thu",
  friday: "fri",
  saturday: "sat",
  sun: "sun",
  mon: "mon",
  tue: "tue",
  wed: "wed",
  thu: "thu",
  fri: "fri",
  sat: "sat",
};

/** Return the IANA-short weekday for an ISO yyyy-mm-dd date. */
export function weekdayOf(iso: string): ShortWeekday {
  // Force midnight UTC so a server in any timezone gets the same answer.
  const d = new Date(iso + "T00:00:00Z");
  return SHORT_WEEKDAYS[d.getUTCDay()]!;
}

/** Normalize "Thursday" / "thu" / "THU" → "thu". Returns null on garbage. */
export function normalizeWeekday(input: string): ShortWeekday | null {
  const k = input.trim().toLowerCase();
  return FULL_TO_SHORT[k] ?? null;
}

/** Add `n` days to an ISO yyyy-mm-dd, returning a new ISO string. */
export function addDays(iso: string, n: number): string {
  const d = new Date(iso + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

/**
 * The next ISO date after `from_iso` whose weekday matches `target`.
 * Includes `from_iso` itself if it already matches AND
 * `inclusive_today` is true (default false: "next Thursday" excludes
 * today even if today is Thursday).
 */
export function nextWeekdayDate(
  from_iso: string,
  target: ShortWeekday,
  inclusive_today = false,
): string {
  const start = inclusive_today ? 0 : 1;
  for (let i = start; i < 14; i++) {
    const candidate = addDays(from_iso, i);
    if (weekdayOf(candidate) === target) return candidate;
  }
  // Mathematically unreachable (any weekday hits within 7 days).
  return addDays(from_iso, 7);
}

/**
 * Pretty-print a 30-day lookup table for the system prompt:
 *
 *   2026-04-26 sun (today)
 *   2026-04-27 mon
 *   2026-04-28 tue
 *   ...
 *
 * The table caps at 30 days, which covers any reasonable trip duration
 * a voice user would plan in a single session.
 */
export function formatDateTable(current_date: string, days = 30): string {
  const lines: string[] = [];
  for (let i = 0; i < days; i++) {
    const iso = addDays(current_date, i);
    const wd = weekdayOf(iso);
    const tag = i === 0 ? " (today)" : "";
    lines.push(`  ${iso} ${wd}${tag}`);
  }
  return lines.join("\n");
}
