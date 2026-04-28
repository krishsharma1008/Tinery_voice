import { describe, test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { dispatchToolCall } from "@/lib/realtime/tools";
import { useItineraryStore } from "@/lib/store/itinerary";

beforeEach(() => {
  // Reset the Zustand store between tests so previous mutations don't bleed.
  useItineraryStore.getState().reset();
});

describe("set_trip_basics weekday validation", () => {
  test("accepts a correct Thursday→Sunday range", async () => {
    const result = await dispatchToolCall(
      "set_trip_basics",
      JSON.stringify({
        destination: "goa",
        start_date: "2026-04-30", // Thursday
        end_date: "2026-05-03", // Sunday
        travelers: 1,
        start_weekday: "thu",
        end_weekday: "sun",
      }),
    );
    assert.equal(result.ok, true);
    if (!result.ok) return;
    assert.ok(
      result.summary.includes("thu") && result.summary.includes("sun"),
      "summary mentions weekdays",
    );
  });

  test("rejects start_date whose weekday is wrong (the screenshot bug)", async () => {
    // The exact bug from the user's screenshot: model picked Wed Apr 29
    // when the user said Thursday.
    const result = await dispatchToolCall(
      "set_trip_basics",
      JSON.stringify({
        destination: "goa",
        start_date: "2026-04-29", // Wednesday
        end_date: "2026-05-02", // Saturday
        travelers: 1,
        start_weekday: "thu",
        end_weekday: "sun",
      }),
    );
    assert.equal(result.ok, false);
    if (result.ok) return;
    assert.equal(result.error, "weekday_mismatch");
    const obj = result as unknown as {
      corrected_start_date: string;
      corrected_end_date: string;
    };
    // Trip duration is 4 days (Wed→Sat = 4 days inclusive). Shifting the
    // start to next Thursday = 2026-04-30 keeps the duration → end_date
    // shifts to 2026-05-03 (Sunday).
    assert.equal(obj.corrected_start_date, "2026-04-30");
    assert.equal(obj.corrected_end_date, "2026-05-03");
  });

  test("rejects end_date weekday mismatch", async () => {
    const result = await dispatchToolCall(
      "set_trip_basics",
      JSON.stringify({
        destination: "goa",
        start_date: "2026-04-30", // Thursday — correct
        end_date: "2026-05-02", // Saturday — but user said Sunday
        travelers: 1,
        end_weekday: "sun",
      }),
    );
    assert.equal(result.ok, false);
    if (result.ok) return;
    assert.equal(result.error, "weekday_mismatch");
    const obj = result as unknown as { corrected_end_date: string };
    assert.equal(obj.corrected_end_date, "2026-05-03");
  });

  test("no weekday args means no validation runs (back-compat)", async () => {
    const result = await dispatchToolCall(
      "set_trip_basics",
      JSON.stringify({
        destination: "goa",
        start_date: "2026-04-29", // Wed; would fail if weekday given
        end_date: "2026-05-02",
        travelers: 1,
      }),
    );
    assert.equal(result.ok, true);
  });
});
