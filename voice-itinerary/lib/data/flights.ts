/**
 * Hand-curated mock flight catalog.
 *
 * The realtime model used to offer to "search for flights" with no backing
 * tool, which made the demo feel hollow. This module is the backing data
 * for the `search_flights` tool: a small set of plausible routes from
 * common origins (BOM, DEL, BLR, JFK, LHR, LAX, SIN, DXB) into each of
 * the five destination airports (GOI, DPS, HND, LIS, DXB).
 *
 * These are NOT real bookings — pricing and times are indicative only.
 * The model voices a couple of options and, when the user picks one,
 * lands the choice on the canvas via add_fixed_event(type:'flight').
 */

export type MockFlight = {
  airline: string;
  flight_no: string;
  from: string; // IATA airport code
  to: string;
  /** Local departure time at origin, "HH:mm" 24h. */
  depart: string;
  /** Local arrival time at destination, "HH:mm". May be next-day if `arrives_next_day`. */
  arrive: string;
  arrives_next_day?: boolean;
  duration_min: number;
  stops: 0 | 1;
  /** Indicative round-trip-equivalent USD price. */
  price_usd: number;
  cabin: "economy" | "premium" | "business";
};

const FLIGHTS: MockFlight[] = [
  // ── Goa (GOI) ──────────────────────────────────────────────────────────
  { airline: "IndiGo",      flight_no: "6E-2317", from: "BOM", to: "GOI", depart: "08:35", arrive: "09:45", duration_min: 70,  stops: 0, price_usd: 62,  cabin: "economy" },
  { airline: "Air India",   flight_no: "AI-684",  from: "BOM", to: "GOI", depart: "12:10", arrive: "13:25", duration_min: 75,  stops: 0, price_usd: 78,  cabin: "economy" },
  { airline: "Vistara",     flight_no: "UK-861",  from: "DEL", to: "GOI", depart: "07:20", arrive: "10:00", duration_min: 160, stops: 0, price_usd: 138, cabin: "economy" },
  { airline: "IndiGo",      flight_no: "6E-5374", from: "DEL", to: "GOI", depart: "14:50", arrive: "17:25", duration_min: 155, stops: 0, price_usd: 122, cabin: "economy" },
  { airline: "IndiGo",      flight_no: "6E-2103", from: "BLR", to: "GOI", depart: "09:05", arrive: "10:25", duration_min: 80,  stops: 0, price_usd: 71,  cabin: "economy" },
  { airline: "Etihad",      flight_no: "EY-280",  from: "DXB", to: "GOI", depart: "21:45", arrive: "03:10", arrives_next_day: true, duration_min: 235, stops: 1, price_usd: 312, cabin: "economy" },
  { airline: "British Airways", flight_no: "BA-261", from: "LHR", to: "GOI", depart: "11:15", arrive: "06:55", arrives_next_day: true, duration_min: 660, stops: 1, price_usd: 712, cabin: "economy" },

  // ── Bali (DPS) ─────────────────────────────────────────────────────────
  { airline: "Singapore Airlines", flight_no: "SQ-942", from: "SIN", to: "DPS", depart: "07:40", arrive: "10:25", duration_min: 165, stops: 0, price_usd: 198, cabin: "economy" },
  { airline: "Scoot",       flight_no: "TR-282",  from: "SIN", to: "DPS", depart: "13:20", arrive: "16:05", duration_min: 165, stops: 0, price_usd: 124, cabin: "economy" },
  { airline: "Garuda",      flight_no: "GA-407",  from: "SIN", to: "DPS", depart: "19:50", arrive: "22:35", duration_min: 165, stops: 0, price_usd: 186, cabin: "economy" },
  { airline: "Qatar Airways", flight_no: "QR-958", from: "LHR", to: "DPS", depart: "21:35", arrive: "23:10", arrives_next_day: true, duration_min: 1115, stops: 1, price_usd: 968, cabin: "economy" },
  { airline: "Emirates",    flight_no: "EK-368",  from: "DXB", to: "DPS", depart: "09:30", arrive: "21:35", duration_min: 545, stops: 0, price_usd: 642, cabin: "economy" },
  { airline: "Vistara",     flight_no: "UK-129",  from: "DEL", to: "DPS", depart: "23:05", arrive: "11:40", arrives_next_day: true, duration_min: 455, stops: 1, price_usd: 488, cabin: "economy" },

  // ── Tokyo (HND) ────────────────────────────────────────────────────────
  { airline: "ANA",         flight_no: "NH-9",    from: "JFK", to: "HND", depart: "11:00", arrive: "14:20", arrives_next_day: true, duration_min: 800, stops: 0, price_usd: 1284, cabin: "economy" },
  { airline: "Japan Airlines", flight_no: "JL-5", from: "JFK", to: "HND", depart: "13:25", arrive: "16:55", arrives_next_day: true, duration_min: 810, stops: 0, price_usd: 1342, cabin: "economy" },
  { airline: "Singapore Airlines", flight_no: "SQ-12", from: "LAX", to: "HND", depart: "23:55", arrive: "05:25", arrives_next_day: true, duration_min: 690, stops: 0, price_usd: 1118, cabin: "economy" },
  { airline: "British Airways", flight_no: "BA-7", from: "LHR", to: "HND", depart: "14:00", arrive: "10:25", arrives_next_day: true, duration_min: 685, stops: 0, price_usd: 1056, cabin: "economy" },
  { airline: "ANA",         flight_no: "NH-839",  from: "SIN", to: "HND", depart: "08:55", arrive: "16:50", duration_min: 415, stops: 0, price_usd: 612, cabin: "economy" },
  { airline: "Air India",   flight_no: "AI-7",    from: "DEL", to: "HND", depart: "20:45", arrive: "07:30", arrives_next_day: true, duration_min: 405, stops: 0, price_usd: 698, cabin: "economy" },

  // ── Lisbon (LIS) ───────────────────────────────────────────────────────
  { airline: "TAP Portugal", flight_no: "TP-203", from: "JFK", to: "LIS", depart: "21:10", arrive: "08:55", arrives_next_day: true, duration_min: 405, stops: 0, price_usd: 612, cabin: "economy" },
  { airline: "United",      flight_no: "UA-961",  from: "JFK", to: "LIS", depart: "20:35", arrive: "08:25", arrives_next_day: true, duration_min: 410, stops: 0, price_usd: 558, cabin: "economy" },
  { airline: "TAP Portugal", flight_no: "TP-1359", from: "LHR", to: "LIS", depart: "10:20", arrive: "12:50", duration_min: 150, stops: 0, price_usd: 142, cabin: "economy" },
  { airline: "Ryanair",     flight_no: "FR-7044", from: "LHR", to: "LIS", depart: "06:45", arrive: "09:15", duration_min: 150, stops: 0, price_usd: 64,  cabin: "economy" },
  { airline: "Emirates",    flight_no: "EK-191",  from: "DXB", to: "LIS", depart: "14:35", arrive: "20:25", duration_min: 470, stops: 0, price_usd: 698, cabin: "economy" },
  { airline: "Vistara",     flight_no: "UK-031",  from: "DEL", to: "LIS", depart: "01:10", arrive: "11:35", duration_min: 685, stops: 1, price_usd: 612, cabin: "economy" },

  // ── Dubai (DXB) ────────────────────────────────────────────────────────
  { airline: "Emirates",    flight_no: "EK-204",  from: "JFK", to: "DXB", depart: "23:00", arrive: "19:35", arrives_next_day: true, duration_min: 755, stops: 0, price_usd: 882, cabin: "economy" },
  { airline: "Emirates",    flight_no: "EK-242",  from: "LAX", to: "DXB", depart: "16:30", arrive: "19:30", arrives_next_day: true, duration_min: 960, stops: 0, price_usd: 1224, cabin: "economy" },
  { airline: "British Airways", flight_no: "BA-107", from: "LHR", to: "DXB", depart: "21:45", arrive: "08:20", arrives_next_day: true, duration_min: 405, stops: 0, price_usd: 488, cabin: "economy" },
  { airline: "Emirates",    flight_no: "EK-501",  from: "BOM", to: "DXB", depart: "04:45", arrive: "06:35", duration_min: 200, stops: 0, price_usd: 218, cabin: "economy" },
  { airline: "IndiGo",      flight_no: "6E-1407", from: "DEL", to: "DXB", depart: "04:20", arrive: "06:55", duration_min: 215, stops: 0, price_usd: 196, cabin: "economy" },
  { airline: "Singapore Airlines", flight_no: "SQ-490", from: "SIN", to: "DXB", depart: "21:25", arrive: "00:45", arrives_next_day: true, duration_min: 440, stops: 0, price_usd: 612, cabin: "economy" },
];

/** IATA airport code → destination id in /lib/data. */
const AIRPORT_TO_DESTINATION: Record<string, string> = {
  GOI: "goa",
  DPS: "bali",
  HND: "tokyo",
  LIS: "lisbon",
  DXB: "dubai",
};

const KNOWN_ORIGINS = [
  "BOM",
  "DEL",
  "BLR",
  "JFK",
  "LHR",
  "LAX",
  "SIN",
  "DXB",
];

/**
 * Look up flights between an origin and a destination airport. Returns at
 * most `max` results sorted by total duration (shortest first), with a
 * gentle preference for non-stop. Soft fallbacks:
 *   • If `from` isn't in the curated origin set, fall back to BOM (for GOI)
 *     or LHR (for everything else) so the model still has something.
 *   • If `to` doesn't match any catalog destination, return ok:false so the
 *     model can pivot aloud.
 */
export function searchFlights(args: {
  from: string;
  to: string;
  max?: number;
}):
  | { ok: true; from: string; to: string; destination_id: string; flights: MockFlight[] }
  | { ok: false; error: string; supported_origins: string[]; supported_destinations: string[] } {
  const max = Math.max(1, Math.min(args.max ?? 4, 6));
  const to = args.to.toUpperCase();
  const destinationId = AIRPORT_TO_DESTINATION[to];
  if (!destinationId) {
    return {
      ok: false,
      error: "destination_airport_not_supported",
      supported_origins: KNOWN_ORIGINS,
      supported_destinations: Object.keys(AIRPORT_TO_DESTINATION),
    };
  }
  const requestedFrom = args.from.toUpperCase();
  const fallbackFrom =
    to === "GOI" || to === "DXB" ? "BOM" : to === "DPS" ? "SIN" : "LHR";
  const from = KNOWN_ORIGINS.includes(requestedFrom)
    ? requestedFrom
    : fallbackFrom;

  const candidates = FLIGHTS.filter((f) => f.from === from && f.to === to);
  if (candidates.length === 0) {
    // No curated direct route; widen to any flight into `to`.
    const widened = FLIGHTS.filter((f) => f.to === to)
      .slice()
      .sort((a, b) => a.stops - b.stops || a.duration_min - b.duration_min)
      .slice(0, max);
    return {
      ok: true,
      from,
      to,
      destination_id: destinationId,
      flights: widened,
    };
  }

  const sorted = candidates
    .slice()
    .sort((a, b) => a.stops - b.stops || a.duration_min - b.duration_min)
    .slice(0, max);
  return { ok: true, from, to, destination_id: destinationId, flights: sorted };
}
