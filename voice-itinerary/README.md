# Tineri Voice — voice-based itinerary builder

White-label demo for **Open Destinations / Tineri**. Press the orb, say where
you're going, and watch your itinerary build itself. Powered by the OpenAI
Realtime API (`gpt-realtime`) over WebRTC.

## Setup (≤5 minutes)

```bash
pnpm install
cp .env.local.example .env.local   # then paste your OPENAI_API_KEY
pnpm dev                            # http://localhost:3000
```

Open in **Chrome** (Safari has stricter autoplay rules; works but may need an
extra click). Click the orb. Allow the mic. Talk.

## Environment

| Var | Required | Notes |
| --- | --- | --- |
| `OPENAI_API_KEY` | yes | Server-only. Never reaches the browser. |
| `ALLOWED_ORIGINS` | optional | Comma-separated extra origins for `/api/realtime/session`. Same-origin always allowed. |
| `NEXT_PUBLIC_CALENDAR_MODE` | optional | `mock` to inject the demo calendar fixture (a Panjim meeting on 2026-05-16 at 15:00). Leave unset for off. |

The key is read by the server route `app/api/realtime/session/route.ts`,
which mints a short-lived ephemeral `client_secret` per call. The browser
only ever sees that ephemeral key (and only for ~60s).

## Canonical demo (Goa, 90s)

1. **You:** "Plan a five-day trip to Goa starting May 15. Two working days,
   the rest chill. I have a meeting in Panjim on day two at three pm."
2. *Trip header + 5-day strip paint in. Day 2 shows the Panjim meeting
   pinned at 15:00.*
3. **Tineri:** "Got it — solo trip?"
4. **You:** "Solo, yeah."
5. **Tineri:** "Putting you in North Goa near Anjuna — sound good?"
6. **You:** "Perfect."
7. *Stay card lands. Days fill in — work-from-cafe, sunset cliff walk,
   Anjuna flea market on Wednesday, Curlies sundowner.*
8. **You:** "Move the cliff hike to sunset on day three."
9. *Card animates to 17:30 on Day 3.*
10. **You:** "Lock it in."
11. *URL flips to `/trip/<id>`. Share link copied.*

A second mini-demo: open a fresh session and say *"three days in Tokyo,
foodie, no museums"* — proves robustness across destinations *(Goa is the
only catalog wired today; Bali / Tokyo / Lisbon / Dubai are Task #8)*.

## What's wired today

- `gpt-realtime` over WebRTC, `semantic_vad` turn detection, ephemeral
  client-secret minting
- 19 tools the model can call: `set_trip_basics`, `set_day_modes`,
  `add_fixed_event`, `set_stay`, `add_activity` (constraint-aware),
  `move_activity`, `remove_activity`, `set_preferences`, `query_catalog`,
  `get_destination_context`, `suggest_slots`, `validate_itinerary`,
  `finalize_itinerary`, `open_print`, `export_ics`,
  `search_flights` (mock data, ~30 curated routes from major hubs),
  `suggest_stays` (proactive ranking by vibe/budget/work-friendly),
  `suggest_nearby` (transit-radius activity discovery),
  `get_transport_info` (airport transfers + intracity)
- Multilingual — auto-detects user's language from the first turn and
  replies in kind. Catalog place names + tool args stay in original/ISO.
- Audio-reactive orb — outer rings scale with mic RMS while listening,
  with assistant audio while speaking. Respects `prefers-reduced-motion`.
- Voice-editable share page — finalize navigates to `/trip/[id]` where
  the orb persists as a FAB and edits debounce-save back to the share URL.
- End-session button — visible whenever the connection is active so you
  don't burn API credits idle.
- Five destination catalogs: Goa, Bali, Tokyo, Lisbon, Dubai — areas,
  stays, activities, food, transit matrix, day templates, seasonal warnings
- Live canvas: trip header, day strip, day list, transcript stream,
  image-rich activity / stay cards, finalize + share view at `/trip/[id]`
  with image parity to the canvas
- Audio ducking on planning turns (assistant audio mutes until first
  store mutation lands, with a 1.5s safety release)
- One-shot auto-reconnect on data-channel / ICE failure with last-8-turn
  replay; falls back to "tap to reconnect" after the second drop
- Mock calendar fixture via `NEXT_PUBLIC_CALENDAR_MODE=mock`; live
  Google Calendar via `NEXT_PUBLIC_CALENDAR_MODE=browser_use` against
  the local `services/calendar-bridge` Python service
- Trip export: print-friendly `/trip/[id]/print` route (Cmd+P → Save
  as PDF) and `.ics` download at `/api/export/[id]/ics`. Voice tools
  `open_print` and `export_ics` trigger the same flows hands-free.

## What's not wired yet

- Real Google Calendar OAuth (superseded by browser-use bridge in
  `services/calendar-bridge`; OAuth path may return if the bridge proves
  too heavy for production hosts)
- True PDF rendering via `@react-pdf/renderer` (the print route covers
  the demo; revisit when the library officially supports React 19)
- Durable share-link store (in-memory `Map`; swap for Vercel KV before
  a real launch)

See `PLAN.md` in the parent directory for the full roadmap.

## Troubleshooting

**Silence after "tuning in…"** — Chrome blocked autoplay. Click anywhere
on the page once, then click the orb.

**"Microphone permission denied"** — Click the lock icon in the URL bar,
allow mic access, refresh.

**"upstream_error 400 Unknown parameter"** — OpenAI Realtime API shape
drifted. Check `lib/realtime/config.ts`; both `output_modalities` and
`audio.output.voice` are placement-sensitive.

**"upstream_error 400 model"** — Your account may not be enabled for
`gpt-realtime`. Try `gpt-4o-realtime-preview-2024-12-17` in
`lib/realtime/config.ts` as a fallback.

**Latency > 3s on first reply** — The Next.js route is cold. Hit it once
with curl before the demo to warm it.

## Security

The OpenAI API key is server-only and never reaches the browser. The
browser holds a short-lived (~60s) ephemeral `client_secret` minted just
before each WebRTC handshake. Other defenses:

- Strict origin allow-list on `/api/realtime/session`
- Per-IP rate limit (10/min in dev; production should swap to Vercel KV)
- Tight CSP including `connect-src 'self' https://api.openai.com wss://api.openai.com`
- `Permissions-Policy: microphone=(self), camera=()`

`.env.local` is gitignored. Rotate the key after public demos.

## Built for

[Open Destinations](https://opendestinations.com) — *we do the tech, you
do the travel.*
