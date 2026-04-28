import { describe, test } from "node:test";
import assert from "node:assert/strict";
import {
  addDays,
  formatDateTable,
  nextWeekdayDate,
  normalizeWeekday,
  weekdayOf,
} from "@/lib/realtime/dateTable";

describe("dateTable.weekdayOf", () => {
  test("known weekdays resolve correctly", () => {
    // 2026-04-26 is a Sunday.
    assert.equal(weekdayOf("2026-04-26"), "sun");
    // 2026-04-30 is a Thursday — the date the user wanted in the demo.
    assert.equal(weekdayOf("2026-04-30"), "thu");
    assert.equal(weekdayOf("2026-04-29"), "wed");
    assert.equal(weekdayOf("2026-05-03"), "sun");
    assert.equal(weekdayOf("2026-05-01"), "fri");
  });
});

describe("dateTable.normalizeWeekday", () => {
  test("accepts long and short forms, case-insensitive", () => {
    assert.equal(normalizeWeekday("Thursday"), "thu");
    assert.equal(normalizeWeekday("thursday"), "thu");
    assert.equal(normalizeWeekday("THURSDAY"), "thu");
    assert.equal(normalizeWeekday("thu"), "thu");
    assert.equal(normalizeWeekday("Thu"), "thu");
    assert.equal(normalizeWeekday(" mon "), "mon");
  });
  test("rejects garbage", () => {
    assert.equal(normalizeWeekday("blursday"), null);
    assert.equal(normalizeWeekday(""), null);
  });
});

describe("dateTable.nextWeekdayDate", () => {
  test("from Sunday, next Thursday is 4 days later", () => {
    // 2026-04-26 (Sun) → next Thu = 2026-04-30
    assert.equal(nextWeekdayDate("2026-04-26", "thu"), "2026-04-30");
  });
  test("default is exclusive of today even when today matches", () => {
    // 2026-04-26 is Sunday; "next Sunday" = 2026-05-03 (7 days later).
    assert.equal(nextWeekdayDate("2026-04-26", "sun"), "2026-05-03");
  });
  test("inclusive_today=true returns today when today matches", () => {
    assert.equal(nextWeekdayDate("2026-04-26", "sun", true), "2026-04-26");
  });
});

describe("dateTable.addDays", () => {
  test("crosses month boundary", () => {
    assert.equal(addDays("2026-04-29", 5), "2026-05-04");
  });
  test("zero is identity", () => {
    assert.equal(addDays("2026-04-26", 0), "2026-04-26");
  });
});

describe("dateTable.formatDateTable", () => {
  test("returns 30 lines by default with today marker", () => {
    const t = formatDateTable("2026-04-26");
    const lines = t.split("\n");
    assert.equal(lines.length, 30);
    assert.ok(lines[0]!.includes("2026-04-26"));
    assert.ok(lines[0]!.includes("sun"));
    assert.ok(lines[0]!.includes("(today)"));
    // Day 5 should be Friday May 1.
    assert.ok(lines[5]!.includes("2026-05-01"));
    assert.ok(lines[5]!.includes("fri"));
  });
  test("custom day count respected", () => {
    const t = formatDateTable("2026-04-26", 7);
    assert.equal(t.split("\n").length, 7);
  });
});
