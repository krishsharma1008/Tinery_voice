import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { searchFlights } from "@/lib/data/flights";

describe("flights.searchFlights", () => {
  test("returns multiple options for BOM → GOI", () => {
    const r = searchFlights({ from: "BOM", to: "GOI" });
    assert.equal(r.ok, true);
    if (!r.ok) return;
    assert.ok(r.flights.length > 0);
    assert.equal(r.from, "BOM");
    assert.equal(r.to, "GOI");
    assert.equal(r.destination_id, "goa");
  });

  test("falls back to a hub when origin is unknown (HYD → GOI uses BOM)", () => {
    const r = searchFlights({ from: "HYD", to: "GOI" });
    assert.equal(r.ok, true);
    if (!r.ok) return;
    assert.equal(r.from, "BOM", "GOI fallback hub is BOM");
    assert.ok(r.flights.length > 0, "fallback still returns flights");
  });

  test("returns ok:false for unknown destination IATA", () => {
    const r = searchFlights({ from: "BOM", to: "XXX" });
    assert.equal(r.ok, false);
    if (r.ok) return;
    assert.equal(r.error, "destination_airport_not_supported");
    assert.ok(r.supported_destinations.includes("GOI"));
    assert.ok(r.supported_destinations.includes("DPS"));
    assert.ok(r.supported_destinations.includes("HND"));
    assert.ok(r.supported_destinations.includes("LIS"));
    assert.ok(r.supported_destinations.includes("DXB"));
  });

  test("respects max parameter", () => {
    const r = searchFlights({ from: "BOM", to: "GOI", max: 2 });
    assert.equal(r.ok, true);
    if (!r.ok) return;
    assert.ok(r.flights.length <= 2);
  });

  test("sorts non-stop flights ahead of one-stops", () => {
    const r = searchFlights({ from: "DEL", to: "DPS" });
    assert.equal(r.ok, true);
    if (!r.ok) return;
    if (r.flights.length >= 2) {
      // Non-stop should appear before one-stop in the result.
      const directFirstIdx = r.flights.findIndex((f) => f.stops === 0);
      const oneStopIdx = r.flights.findIndex((f) => f.stops === 1);
      if (directFirstIdx !== -1 && oneStopIdx !== -1) {
        assert.ok(
          directFirstIdx < oneStopIdx,
          "non-stop flights should sort first",
        );
      }
    }
  });

  test("widens to any flight into the destination if curated route is empty", () => {
    // CDG isn't a curated origin. Tool should fallback to LHR for non-Goa
    // destinations. For Bali (DPS), fallback hub is SIN.
    const r = searchFlights({ from: "CDG", to: "DPS" });
    assert.equal(r.ok, true);
    if (!r.ok) return;
    assert.ok(r.flights.length > 0);
    assert.equal(r.from, "SIN", "DPS fallback is SIN");
  });
});
