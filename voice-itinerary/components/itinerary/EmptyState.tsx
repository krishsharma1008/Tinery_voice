import { VoiceOrb } from "@/components/voice/VoiceOrb";

const SAMPLE_PROMPTS = [
  "5-day trip to Goa, two work days, rest chill",
  "Long weekend in Lisbon, foodie, no museums",
  "Tokyo for a week, cherry blossoms if I'm lucky",
];

export function EmptyState() {
  return (
    <section className="relative flex flex-1 flex-col items-center justify-center px-6 py-12">
      <div className="flex flex-col items-center text-center">
        <p className="mb-3 inline-flex items-center gap-2 rounded-full border border-[color:var(--color-cream-200)] bg-white/60 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.18em] text-[color:var(--color-navy-700)]">
          <span className="h-1.5 w-1.5 rounded-full bg-[color:var(--color-success)]" />
          Tineri voice · early access
        </p>

        <h1 className="mb-3 max-w-2xl text-[42px] font-semibold leading-[1.05] tracking-tight text-[color:var(--color-navy-900)] sm:text-[56px]">
          Plan your next trip
          <br />
          <span
            className="text-[color:var(--color-orange-500)]"
            style={{ fontFamily: "var(--font-script)" }}
          >
            by talking to it.
          </span>
        </h1>

        <p className="mb-12 max-w-xl text-base leading-7 text-[color:var(--color-ink-600)] sm:text-lg">
          Press the orb. Tell it where you&apos;re going, what you&apos;ve got
          to do, and what you don&apos;t. Watch the days fill in as you talk.
        </p>

        <div className="mb-10">
          <VoiceOrb />
        </div>

        <p className="mb-3 text-xs font-medium uppercase tracking-[0.16em] text-[color:var(--color-ink-400)]">
          try saying something like
        </p>
        <ul className="flex flex-wrap items-center justify-center gap-2 text-sm">
          {SAMPLE_PROMPTS.map((s) => (
            <li
              key={s}
              className="rounded-full border border-[color:var(--color-cream-200)] bg-white/70 px-3 py-1.5 text-[color:var(--color-navy-700)]"
            >
              &ldquo;{s}&rdquo;
            </li>
          ))}
        </ul>
      </div>

      <p className="absolute bottom-4 right-5 text-[10px] uppercase tracking-[0.18em] text-[color:var(--color-ink-400)]">
        we do the tech · you do the travel
      </p>
    </section>
  );
}
