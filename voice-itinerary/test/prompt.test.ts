import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { buildSystemPrompt } from "@/lib/realtime/prompt";

describe("prompt.buildSystemPrompt", () => {
  test("contains all expected sections", () => {
    const prompt = buildSystemPrompt({ current_date: "2026-04-26" });
    const required = [
      "You are Tineri",
      "Language. Detect",
      "RULE — show, then tell",
      "Information hierarchy",
      "Day-by-day planning",
      "Question budget",
      "Aggressive defaults",
      "Tool discipline",
      "Flights. When the user mentions",
      "Hospitality (stays, nearby, transport)",
      "Recovery rules",
      "Calendar awareness",
      "Out of scope",
      "Voice quirks",
    ];
    for (const needle of required) {
      assert.ok(
        prompt.includes(needle),
        `expected section "${needle}" in prompt`,
      );
    }
  });

  test("injects current_date into the prompt", () => {
    const prompt = buildSystemPrompt({ current_date: "2026-04-26" });
    assert.ok(prompt.includes("Current date: 2026-04-26"));
  });

  test("renders existing_commitments block when provided", () => {
    const prompt = buildSystemPrompt({
      current_date: "2026-04-26",
      existing_commitments: [
        {
          title: "Standup",
          start_local: "2026-05-16T09:30",
          end_local: "2026-05-16T10:00",
          has_video: true,
        },
        {
          title: "Meeting with Anand",
          start_local: "2026-05-16T15:00",
          end_local: "2026-05-16T16:00",
          location: "Panjim, Goa",
          has_video: false,
        },
      ],
    });
    assert.ok(prompt.includes("Existing commitments"));
    assert.ok(prompt.includes("Standup"));
    assert.ok(prompt.includes("Panjim, Goa"));
    assert.ok(prompt.includes("(video)"));
  });

  test("omits commitments block when none provided", () => {
    const prompt = buildSystemPrompt({ current_date: "2026-04-26" });
    assert.ok(!prompt.includes("Existing commitments"));
  });

  test("renders itinerary_snapshot block when continuity is needed", () => {
    const snapshot =
      "Trip: 5-day Goa, 2026-05-15→2026-05-19, 1 traveler, chill vibe.\nDay 1 2026-05-15 (work): open";
    const prompt = buildSystemPrompt({
      current_date: "2026-04-26",
      itinerary_snapshot: snapshot,
    });
    assert.ok(prompt.includes("CURRENT TRIP STATE"));
    assert.ok(prompt.includes("do NOT start over"));
    assert.ok(prompt.includes("do NOT re-greet"));
    assert.ok(prompt.includes("5-day Goa"));
  });

  test("omits snapshot block when none provided (fresh session)", () => {
    const prompt = buildSystemPrompt({ current_date: "2026-04-26" });
    assert.ok(!prompt.includes("CURRENT TRIP STATE"));
  });
});
