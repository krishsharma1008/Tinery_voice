import { describe, test } from "node:test";
import assert from "node:assert/strict";
import {
  areaToRegion,
  templatePrimaryRegion,
  planDay,
  proposeFullItinerary,
} from "@/lib/realtime/scheduler";
import { goa } from "@/lib/data/goa";
import type { ItineraryDay } from "@/lib/store/itinerary";

function buildDays(start_iso: string, end_iso: string): ItineraryDay[] {
  const start = new Date(start_iso + "T00:00:00");
  const end = new Date(end_iso + "T00:00:00");
  const days: ItineraryDay[] = [];
  let i = 0;
  for (
    let cur = new Date(start);
    cur.getTime() <= end.getTime();
    cur.setDate(cur.getDate() + 1)
  ) {
    days.push({
      index: i++,
      date: cur.toISOString().slice(0, 10),
      mode: "leisure",
      fixed_events: [],
      activities: [],
    });
  }
  return days;
}

describe("scheduler.areaToRegion", () => {
  test("Anjuna is in north Goa", () => {
    assert.equal(areaToRegion(goa, "anjuna"), "north");
  });
  test("Palolem is in south Goa", () => {
    assert.equal(areaToRegion(goa, "palolem"), "south");
  });
  test("unknown area returns null", () => {
    assert.equal(areaToRegion(goa, "atlantis"), null);
  });
  test("undefined area returns null", () => {
    assert.equal(areaToRegion(goa, undefined), null);
  });
});

describe("scheduler.templatePrimaryRegion", () => {
  test("North-Goa chill template maps to north", () => {
    const tpl = goa.canonical_day_templates.find(
      (t) => t.id === "tpl_north_goa_chill",
    );
    assert.ok(tpl);
    assert.equal(templatePrimaryRegion(tpl!, goa), "north");
  });
  test("Palolem template maps to south", () => {
    const tpl = goa.canonical_day_templates.find(
      (t) => t.id === "tpl_palolem_quiet",
    );
    assert.ok(tpl);
    assert.equal(templatePrimaryRegion(tpl!, goa), "south");
  });
});

describe("scheduler.planDay region lock (Anjuna stay → no Palolem)", () => {
  test("planDay with Anjuna stay never picks the Palolem template", () => {
    const days = buildDays("2026-04-30", "2026-05-03"); // Thu→Sun, the demo range
    // Iterate every day in this range; on every day, planDay must NOT
    // return the Palolem template.
    for (const day of days) {
      const r = planDay({
        day,
        dest: goa,
        intent: "chill",
        stay_area_id: "anjuna",
      });
      if (r.ok) {
        assert.notEqual(
          r.template_id,
          "tpl_palolem_quiet",
          `day ${day.index} (${day.date}) should not pick Palolem from an Anjuna stay`,
        );
      }
    }
  });

  test("explicit must_include opts back into the south region", () => {
    const days = buildDays("2026-04-30", "2026-04-30");
    const day = days[0]!;
    const r = planDay({
      day,
      dest: goa,
      intent: "chill",
      stay_area_id: "anjuna",
      must_include: ["act_dolphin_palolem"],
    });
    assert.equal(r.ok, true);
    if (!r.ok) return;
    // The user explicitly asked for a Palolem activity — region lock
    // bypassed for that day. The dolphin trip must be in slots.
    const dolphin = r.slots.find((s) => s.activity_id === "act_dolphin_palolem");
    assert.ok(dolphin, "must_include item lands in slots");
  });

  test("no stay_area_id means lock is disabled (legacy behaviour)", () => {
    const days = buildDays("2026-04-30", "2026-05-03");
    let pickedPalolem = false;
    for (let attempt = 0; attempt < 5; attempt++) {
      const r = proposeFullItinerary({
        days,
        dest: goa,
        intent: "chill",
      });
      if (r.days.some((d) => d.ok && d.template_id === "tpl_palolem_quiet")) {
        pickedPalolem = true;
        break;
      }
    }
    // Without a stay, Palolem CAN be picked (no lock). This proves the
    // lock isn't accidentally always-on.
    assert.ok(pickedPalolem, "Palolem reachable when no stay set");
  });
});

describe("scheduler.proposeFullItinerary respects stay region", () => {
  test("All planned days for an Anjuna 4-day chill trip are within the north region", () => {
    const days = buildDays("2026-04-30", "2026-05-03");
    const r = proposeFullItinerary({
      days,
      dest: goa,
      intent: "chill",
      stay_area_id: "anjuna",
    });
    for (const d of r.days) {
      if (!d.ok) continue;
      // Every slot's area must be in the north region OR have no area
      // (free-text slot).
      for (const slot of d.slots) {
        if (!slot.area_id) continue;
        const region = areaToRegion(goa, slot.area_id);
        if (region) {
          assert.equal(
            region,
            "north",
            `day ${d.day_index} slot ${slot.title} is in region ${region}`,
          );
        }
      }
    }
  });
});
