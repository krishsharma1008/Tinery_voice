# Tineri Voice — Voice-Based Itinerary Builder

A real-time voice concierge that builds a polished, day-by-day travel itinerary while you talk. White-label demo for Open Destinations / Tineri.

---

## 1. Goals & success criteria

- **North-star utterance works first try:** *"Five-day trip to Goa, two working days, I have a meeting in Panjim, the rest are chill."* The screen fills with a usable 5-day skeleton in under 4 seconds, and the assistant only asks 1–2 follow-ups before refining specifics.
- **Conversational, not transactional:** users can interrupt mid-sentence, change their mind, and the itinerary mutates live on screen.
- **Demo-grade polish:** a recruiter or design-conscious PM should look at the UI and feel it could ship as part of Tineri tomorrow.
- **End-to-end flow without mocking the demo:** real OpenAI Realtime call → real tool calls → real on-screen state changes → finalized shareable itinerary view.

Out of scope for this build: real bookings, payments, account/auth, multi-traveler collaboration, server-side persistence beyond an in-memory store keyed by share id.

---

## 2. Architecture at a glance

```
┌─ Browser (Next.js client) ─────────────────────────────────────┐
│                                                                 │
│  VoiceOrb ──► RTCPeerConnection ◄────► OpenAI Realtime          │
│      │            │  (WebRTC: mic up,    (gpt-realtime,         │
│      │            │   audio down,        server_vad turn        │
│      │            │   data channel)      detection, tools)      │
│      │            ▼                                             │
│      │        DataChannel events ──► Tool dispatcher ──┐        │
│      │                                                  ▼        │
│      ▼                                          Itinerary Store  │
│  Transcript ◄──────── audio_transcript ──────────► (Zustand)     │
│                                                          │        │
│                                                          ▼        │
│                                              ItineraryCanvas      │
│                                              (TripHeader,         │
│                                               DayStrip, Cards)    │
└─────────────────────────────────────────────────────────────────┘
            ▲                                       ▲
            │ POST /api/realtime/session            │ GET /api/share/[id]
            │ (mints ephemeral client_secret)       │ (read-only finalized view)
            ▼                                       ▼
┌─ Next.js server routes ────────────────────────────────────────┐
│  • Holds OPENAI_API_KEY (server-only env)                       │
│  • POST /api/realtime/session → calls OpenAI                    │
│      /v1/realtime/sessions, returns { client_secret, model }    │
│  • POST /api/share          → stash itinerary JSON, return id   │
│  • GET  /api/share/[id]     → fetch                             │
└─────────────────────────────────────────────────────────────────┘
```

**Key safety property:** the OpenAI API key never reaches the browser. The browser only ever holds a ~60-second ephemeral `client_secret` minted by our server route.

---

## 3. Tech stack

- **Next.js 15** (App Router) + **TypeScript**, deployable to Vercel.
- **Tailwind CSS** + a small set of custom primitives (button, card, sheet) — no shadcn dependency, but same composition style. Keeps the bundle tight and lets us hit Tineri's brand exactly.
- **Framer Motion** for the itinerary materializing animation, day-card transitions, voice orb pulse.
- **Zustand** for the itinerary + voice-state store (simple, no boilerplate, perfect for live UI mutations from tool calls).
- **OpenAI Realtime** (`gpt-realtime`) via WebRTC.
- **lucide-react** for icons; **Plus Jakarta Sans** + **Caveat** (script accent for the wordmark) via `next/font`.
- **Unsplash Source / hand-picked images** for destination imagery (committed locally to avoid hotlink failures in demo).

No database. Mock catalog lives as JSON in `lib/data/`. Share-link state lives in an in-memory `Map` on the server (acceptable for demo; warns on cold start).

---

## 4. Directory layout

```
voice-itinerary/
├─ app/
│  ├─ layout.tsx                       # font + theme
│  ├─ page.tsx                         # main canvas (voice + itinerary)
│  ├─ trip/[id]/page.tsx               # finalized read-only view
│  └─ api/
│     ├─ realtime/session/route.ts     # mint ephemeral client_secret
│     └─ share/route.ts + [id]/route.ts
│
├─ components/
│  ├─ voice/
│  │  ├─ VoiceOrb.tsx                  # the central animated mic
│  │  ├─ TranscriptStream.tsx          # rolling transcript w/ user vs. assistant
│  │  ├─ StateBadge.tsx                # idle/listening/thinking/speaking pill
│  │  └─ ConnectionStatus.tsx          # network + reconnection UX
│  ├─ itinerary/
│  │  ├─ TripHeader.tsx                # destination, dates, travelers, vibe
│  │  ├─ DayStrip.tsx                  # horizontal day chips w/ mode tags
│  │  ├─ DayCard.tsx                   # full-width day expansion
│  │  ├─ ActivityCard.tsx              # single slot (time, place, image)
│  │  ├─ StayCard.tsx                  # accommodation
│  │  └─ EmptyState.tsx                # pre-conversation hero
│  ├─ ui/                              # button, card, chip, sheet primitives
│  └─ brand/
│     ├─ Logo.tsx                      # Tineri wordmark + Open Destinations lockup
│     └─ Footer.tsx
│
├─ lib/
│  ├─ realtime/
│  │  ├─ client.ts                     # WebRTC connection manager
│  │  ├─ session.ts                    # session.update payload builder
│  │  ├─ tools.ts                      # tool schemas + dispatcher
│  │  ├─ events.ts                     # typed event helpers for data channel
│  │  └─ prompt.ts                     # system prompt
│  ├─ store/
│  │  ├─ itinerary.ts                  # zustand: trip, days, activities
│  │  └─ voice.ts                      # zustand: connection + speaking state
│  └─ data/
│     ├─ index.ts                      # destination registry + search helpers
│     ├─ goa.ts
│     ├─ bali.ts
│     ├─ tokyo.ts
│     ├─ lisbon.ts
│     └─ dubai.ts
│
├─ public/
│  └─ destinations/                    # ~6 hero images per destination
│
├─ styles/globals.css
├─ .env.local                          # OPENAI_API_KEY (gitignored)
└─ README.md
```

---

## 5. Voice UX — state machine and edge cases

### 5.1 Connection states (visible to user)

```
  IDLE ──tap mic──► CONNECTING ──session.created──► READY
   ▲                    │                              │
   │                    │ error                        │
   │                    ▼                              ▼
   └──── DISCONNECTED ◄──────── reconnect attempts ◄ ACTIVE
                                                       │
                                  ┌────────────────────┼─────────────────────┐
                                  ▼                    ▼                     ▼
                              LISTENING            THINKING              SPEAKING
                              (user voice         (model is             (model audio
                               detected by        formulating           playing,
                               server VAD)        / tool calling)        user can barge in)
```

The voice orb's color, scale, and pulse rate map to these states. Transitions are <120ms so the user always feels they know what's happening.

### 5.2 Edge cases handled (deep list)

| Case | Handling |
|---|---|
| User barges in while assistant is speaking | Server VAD fires `input_audio_buffer.speech_started`; we send `response.cancel`; orb flips to LISTENING; current audio buffer fades out in 60ms. |
| 8s of silence after assistant prompt | Soft auto-prompt: assistant says "Take your time — want to keep going or save what we have?" Configurable; only fires once per silence. |
| User talks before connection ready | We capture the SDP early but block speech recognition; show "tuning in…" copy on the orb. Retry once on failure. |
| Network blip / data channel close | Auto-reconnect: re-mint token, re-establish PC, replay `session.update`, restore conversation context via `conversation.item.create` for last 8 turns. |
| Mic permission denied | Show explicit fallback panel with text input. Same tools, same store; conversation still works (degraded). |
| Multiple speakers / background noise | Server VAD threshold tuned 0.55; we expose a sensitivity slider in a settings sheet. |
| Languages / accents | Default English. Goa demo will use Indian-accented English — `gpt-realtime` handles this well; voice = `cedar` or `marin` for warmth. |
| Long monologue from user | We don't interrupt unless model has a tool to call. Visual chip "got it, planning…" appears so the user knows it's listening. |
| User says contradictions ("make day 3 chill" then "actually all 5 chill") | Tools are idempotent state-mutators with last-write-wins. Activities never silently dropped — they go to a `parking_lot` array shown as "Possible adds" and surfaced in transcript. |
| User says ambiguous date ("next weekend") | Model resolves to absolute date (today is 2026-04-25 → "next weekend" = 2026-05-02 to 2026-05-03) and confirms once: "Setting May 2nd–3rd, sound right?" |
| User finalizes before all days have content | Finalize is allowed; gaps render as "Open afternoon — explore freely" placeholders rather than blocking. |
| Tool execution fails (e.g., destination not in mock catalog) | Tool returns `{ ok: false, suggestion: ["Goa","Bali",…] }`; assistant proposes the closest match aloud. |
| User says "stop" / "wait" | Treated as conversational interrupt → cancel + listen. Different from "cancel trip" which model interprets via context. |
| Profanity / unrelated requests | System prompt steers back politely; refuses out-of-domain (no recipes, no coding help). |

### 5.3 Voice orb visual

A 220px round gradient (deep navy → orange) on cream. Five visual states:

- **Idle:** static, subtle inner ring breathing at 0.5Hz.
- **Listening:** outer ring pulses with mic amplitude (Web Audio analyser node, RMS-driven scale 1.0→1.08).
- **Thinking:** orange shimmer rotates around the rim.
- **Speaking:** soft audio-reactive ripples; transcript types out as audio plays.
- **Disconnected:** muted gray, small reconnect icon.

A second smaller orb appears in the corner once you scroll (always-accessible mic without losing the canvas).

---

## 6. Conversation design — how we collect preferences

The whole UX hinges on this. The model's job is to **populate the canvas first, then ask only what's structurally missing**, in priority order.

### 6.1 Information hierarchy

We split inputs into four priority tiers:

1. **Structural** (must-have to draw a skeleton): destination, duration, traveler count.
2. **Anchoring** (drives day-shape): fixed events (meetings, weddings), arrival/departure times, work-vs-leisure day mix.
3. **Refining** (drives content choice): area/neighborhood, vibe (chill, adventure, foodie), budget tier, dietary, mobility.
4. **Polishing** (last 10%): preferred meal times, transit preference, must-sees, no-gos.

The model is told: *as soon as Tier 1 is known, draw the skeleton via tools. Then ask one Tier-2 question. Then propose Tier-3 defaults out loud and let the user redirect rather than asking permission.*

### 6.2 Two-pass flow

**Pass 1 — capture & sketch (≤ 15s):**
1. User dumps intent.
2. Model parses with NLU → emits parallel tool calls: `set_trip_basics`, `set_day_modes`, `add_fixed_event`.
3. Canvas renders skeleton: trip header + day strip with mode tags.
4. Model verbal summary in ≤ 12 words: "Five days in Goa, two work, three chill, meeting day two."

**Pass 2 — refine (rolling, mixed-initiative):**
- Model picks the highest-impact unknown and asks **one** focused question.
- After each user turn, model issues 1–3 tool calls, *then* speaks. This is the "show, don't tell" rule — user sees the change before hearing about it.
- When the canvas is ~80% filled, model offers: "Want me to lock this in or tweak anything?" → finalize tool.

### 6.3 Defaults the model is allowed to assume

To avoid death-by-questions, the system prompt explicitly licenses the model to assume:

- Solo traveler unless told otherwise (and confirms *once*).
- Mid-tier budget unless told otherwise.
- For Goa specifically: North Goa stay if the vibe is "party/chill/young", South Goa if "quiet/luxury/family".
- Meal cadence: lunch 13:00, dinner 20:00.
- Keep one buffer hour after any flight or meeting.
- Never schedule before 09:00 unless user mentions early activity.

The model voices the assumption ("I'm putting you in North Goa near Anjuna — sound good?") rather than asking blind.

---

## 7. Tool catalog (function calls)

All tools are pure mutators on the itinerary store. Names and shapes:

```ts
set_trip_basics({
  destination: string,           // must match a key in /lib/data
  start_date: string,            // ISO yyyy-mm-dd
  end_date: string,
  travelers: number,
  vibe?: "chill" | "adventure" | "foodie" | "cultural" | "party" | "family" | "mixed"
})

set_day_modes({
  modes: Array<"work" | "leisure" | "travel" | "chill" | "adventure">
}) // length must equal trip duration

add_fixed_event({
  day_index: number,             // 0-based
  start_time: string,            // "HH:mm"
  duration_minutes: number,
  title: string,
  location?: string,             // matched against destination POIs
  type: "meeting" | "flight" | "event" | "reservation"
})

set_stay({
  area: string,                  // e.g. "North Goa - Anjuna"
  property_id?: string,          // catalog lookup; if absent, model picks
  check_in_day: number,
  check_out_day: number
})

add_activity({
  day_index: number,
  start_time: string,
  duration_minutes: number,
  activity_id?: string,          // catalog lookup
  title?: string,                // free text fallback
  notes?: string
})

move_activity({ from: ActivityRef, to: { day_index, start_time } })
remove_activity({ ref: ActivityRef })

set_preferences({
  budget_tier?: "backpack" | "comfort" | "premium" | "luxury",
  dietary?: string[],
  mobility?: "high" | "moderate" | "low",
  must_sees?: string[],
  avoid?: string[]
})

query_catalog({
  destination: string,
  filter: { type?: "stay" | "activity" | "food", tags?: string[], area?: string }
}) // returns up to 6 matching items

finalize_itinerary({})           // freezes state, returns share_id
```

Every tool returns `{ ok: boolean, summary: string, ...details }`. The `summary` is what the model uses to narrate the change — keeps voiced output honest and grounded in actual state.

The dispatcher lives in `lib/realtime/tools.ts` and is a single switch over `name`. Each branch:
1. Validates args with Zod.
2. Mutates the Zustand store.
3. Returns the result object → posted back over the data channel as a `function_call_output` conversation item.
4. Triggers a fresh `response.create`.

---

## 8. Mock data — five destinations at maximum depth

Each destination ships as a TS module with this shape:

```ts
{
  id, name, country, hero_images[], color_accent,
  areas: [{ id, name, vibe_tags, description }],
  stays: [{ id, name, area_id, tier, tags, image, blurb, work_friendly }],
  activities: [{ id, name, area_id, duration_min, tags,
                 best_time_of_day, image, blurb,
                 work_friendly, indoor_outdoor, intensity }],
  food: [{ id, name, area_id, cuisine, price_tier, tags, image }],
  transit_notes: string,
  airport_code: string,
  weather_window: { ... }
}
```

**Five destinations, max depth means:**

| Destination | Areas | Stays | Activities | Food | Notes |
|---|---|---|---|---|---|
| **Goa, India** | 6 (Anjuna, Vagator, Calangute, Panjim, Palolem, Ashvem) | 14 | 32 | 18 | Hero demo. Tags: work-friendly cafés, beach shacks, cliff hikes, Old Goa heritage. |
| **Bali, Indonesia** | 5 (Canggu, Ubud, Uluwatu, Seminyak, Sidemen) | 12 | 28 | 16 | Coworking-heavy in Canggu. |
| **Tokyo, Japan** | 6 (Shibuya, Shinjuku, Asakusa, Ginza, Shimokitazawa, Daikanyama) | 12 | 30 | 20 | Dense schedule possible; transit-aware suggestions. |
| **Lisbon, Portugal** | 5 (Alfama, Baixa, Bairro Alto, Belém, Príncipe Real) | 10 | 24 | 16 | Walkable; tram lore. |
| **Dubai, UAE** | 5 (Marina, Downtown, JBR, Old Dubai, Palm) | 10 | 24 | 14 | Indoor-friendly for summer; luxury tier strong. |

Tagging vocabulary is shared across destinations (`#chill #work-friendly #romantic #adventure #foodie #family #late-night #morning #sunset #budget #premium`) so the assistant can reason consistently.

Images: pre-curated, committed under `public/destinations/<id>/`. Roughly 8–12 images per destination, reused across cards.

---

## 9. Visual design (Tineri-aligned)

### 9.1 Tokens

```
Color
  --navy-900:  #0E3F5C   (primary surface, text on light)
  --navy-700:  #14536F
  --navy-100:  #E6EFF4
  --orange-500:#F08A2C   (CTA, accent, brand pulse)
  --orange-300:#F8B97A
  --cream-50:  #FBF7EE   (page background)
  --cream-100: #F4ECDC
  --ink-900:   #0B1A23
  --success:   #2C8E6B
  --danger:    #C04B3A

Type
  --font-sans: "Plus Jakarta Sans", system-ui
  --font-script:"Caveat" (used only in the Tineri wordmark)
  Scale: 12 / 14 / 16 / 18 / 22 / 28 / 36 / 48

Radii: 8 / 12 / 18 / 28
Shadow: layered, warm — rgba(14,63,92, .08) at 12px
Motion: 180–280ms, ease-out-expo for entrances; spring(220, 26) for orb
```

### 9.2 Layout (desktop ≥ 1024px)

```
┌────────────────────────────────────────────────────────────────────────┐
│ Tineri (script)   ·   open destinations          settings · share · …  │
├──────────────────┬─────────────────────────────────────────────────────┤
│                  │  Goa · 5 days · May 15 – 19 · solo · chill+work     │
│                  │  ───────────────────────────────────────────────    │
│   [VoiceOrb]     │  ▣ Day 1 work  ▣ Day 2 work  ▢ Day 3 chill  …       │
│                  │  ───────────────────────────────────────────────    │
│   transcript     │                                                     │
│   stream         │   ┌─ Day 1 ──────────────────────────────┐          │
│                  │   │  09:30  Cafe coworking — Anjuna      │          │
│                  │   │  13:00  Lunch · Burger Factory       │          │
│                  │   │  19:00  Sunset · Anjuna cliffs       │          │
│                  │   └──────────────────────────────────────┘          │
│  [push-to-talk]  │   …                                                 │
│  [end & share]   │                                                     │
└──────────────────┴─────────────────────────────────────────────────────┘
```

Mobile: stacks vertically, voice orb sticks to bottom-right as a FAB.

### 9.3 Specific touches that sell the demo

- The day strip animates in **left-to-right** as `set_day_modes` fires — feels like the trip is being painted.
- Activity cards slide up + fade with a 60ms stagger.
- A subtle "Tineri" wordmark in script sits top-left; the Open Destinations compass + lockup sits top-right. We're an extension, not a replacement.
- Hero imagery uses gentle Ken Burns on the trip header — the same visual language as the Tineri marketing sheet.
- Empty state (pre-conversation) shows the orb on a Tineri-style hero image with copy: *"Press to plan. Talk like you're texting a friend."*

---

## 10. Build phases

Each phase is independently demoable and ends with a green "it works" check.

| # | Phase | Output | Approx. time |
|---|---|---|---|
| 1 | **Scaffold + brand shell** | Next.js app, Tailwind, fonts, color tokens, top nav, empty hero. Static. | 2h |
| 2 | **Realtime token route + minimal connect** | `/api/realtime/session` mints `client_secret`. Client connects via WebRTC, you can hear the model say "Hi!" | 2h |
| 3 | **Voice orb + state machine + transcript** | Orb reflects all 5 states; transcript streams; mic permissions handled. | 2.5h |
| 4 | **Itinerary store + tool plumbing** | `set_trip_basics`, `set_day_modes`, `add_fixed_event` wired end-to-end. Saying the north-star utterance fills the trip header + day strip live. | 3h |
| 5 | **Mock catalog + retrieval tool + activity tools** | All 5 destinations seeded. `add_activity`, `set_stay`, `query_catalog`. Saying "add a cliff hike at sunset" lands a card on the right day. | 3.5h |
| 6 | **Conversation polish (system prompt, edge cases)** | Interruption, silence prompts, ambiguity confirmation, defaults licensing. | 2.5h |
| 7 | **Visual polish + finalize/share view** | Animations, hero imagery, share page at `/trip/[id]`. | 2.5h |
| 8 | **Demo dry-runs + bug bash** | Run the demo script 5x; fix everything that flickers. | 2h |

**Total: ~20 hours of focused work.** Each phase is a natural commit / checkpoint.

---

## 11. Demo script (≈90 seconds, recorded as the canonical flow)

1. Open the app. Hero image, "Press to plan" copy, big orb. Press it.
2. **You:** "Plan a five-day trip to Goa starting May 15. Two working days, the rest chill. I have a meeting in Panjim on day two at 3 pm."
3. *Within ~3s the trip header and day strip populate. Day 2 shows a "Meeting · Panjim · 15:00" pin.*
4. **Tineri:** "Got it — five days, solo trip?"
5. **You:** "Solo, yeah."
6. **Tineri:** "I'll put you in North Goa near Anjuna — close to cafés for work and the chill beaches you want. Cool?"
7. **You:** "Perfect."
8. *Stay card slides in. Day 1 fills with coworking + sunset; Day 2 with morning work + the meeting + a quiet dinner; Days 3–5 fill with hike, beach day, Old Goa heritage walk.*
9. **You** (interrupting): "Actually move the cliff hike to sunset on day three."
10. *Card animates from morning → 18:00 slot.*
11. **Tineri:** "Done. Want me to lock it in?"
12. **You:** "Yes."
13. *Page transitions to finalized view. URL becomes `/trip/abc123`. Toast: "Share link copied."*

A second mini-demo proves robustness: open a fresh session, say *"3 days in Tokyo, foodie, no museums"* — same flow, different destination, different vibe vocabulary.

---

## 12. Open risks & decisions

- **API key hygiene:** the key shared in chat must be rotated. The new key goes only in `.env.local`. (Already flagged.)
- **Realtime model availability:** plan assumes `gpt-realtime` (GA). If the org account is gated to a preview model, we fall back to `gpt-4o-realtime-preview-2024-12-17` — same connection flow, same tool API.
- **Latency budget:** target end-to-end (user stops talking → first token of audio reply) under 800ms on a good connection. WebRTC + server VAD usually lands here. If it drifts past 1.2s during dry runs, we tighten `silence_duration_ms` to 350.
- **Voice choice:** `marin` (warm female) by default; `cedar` (warm male) as a quick toggle in the settings sheet — useful for variety in recordings.
- **Hallucinated catalog items:** the system prompt restricts the model to `query_catalog` results when naming specific places. Free-text titles are allowed only for generic activities ("morning coffee", "beach time").
- **Sensitive content / out-of-scope:** model declines coding/medical/legal asks; redirects warmly back to trip planning.
- **Shareable trip persistence:** in-memory only for the demo. If we want true persistence, add `@vercel/kv` in ~30 minutes — but it's not required for the recording.

---

## 13. What I will build, in order, after approval

1. `voice-itinerary/` Next.js scaffold inside the working directory.
2. `.env.local` (gitignored) with the *new, rotated* `OPENAI_API_KEY`.
3. Phase 1 → Phase 8 from §10, committing at each phase boundary.
4. A short `README.md` covering `pnpm dev`, env vars, and the demo script.
5. A final dry-run pass against the demo script in §11.

After approval I'll start with Phase 1 and check in with you at the end of Phase 2 (first time you can hear the model talk back) before going deep on UI.

---

## 14. Codex review corrections (2026-04-25)

Independent review against current OpenAI Realtime docs surfaced several corrections to §2–§7. These supersede the earlier text where they conflict.

### 14.1 Realtime API surface — corrected

| Was | Is now |
|---|---|
| `POST /v1/realtime/sessions` | `POST /v1/realtime/client_secrets` (returns ephemeral key in `data.value`) |
| SDP `POST /v1/realtime?model=gpt-realtime` | SDP `POST /v1/realtime/calls` with `Authorization: Bearer ${EPHEMERAL_KEY}` |
| `modalities: ["audio","text"]` | `output_modalities: ["audio"]` (text + audio simultaneously not allowed; transcripts arrive as separate events) |
| Voice toggle anytime | Voice **cannot** change after first audio emission — set in initial session config only |
| `turn_detection.server_vad` only | **Default to `semantic_vad`** for natural demo: `{ type: "semantic_vad", eagerness: "high", create_response: true, interrupt_response: true }`. Use `server_vad` only when we need deterministic silence tuning. |
| Tool execution on `response.function_call_arguments.delta/.done` | Buffer deltas for UI debug only. Execute on **`response.done`** — that's where the complete function call arrives. Reply with `conversation.item.create` `{ type: "function_call_output", call_id, output: <JSON string> }` then `response.create`. |
| Mint token at page load | Mint **just before SDP exchange**, retry once on auth/expiry. Never prefetch. |

### 14.2 "Show then tell" is not guaranteed — design around it

We can't actually beat audio frames with React renders for every turn. Two enforcement mechanisms:

- **Planning turns are tool-only.** When the user gives a "plan a trip" utterance, the first model response runs with `tool_choice: "required"` (or a forced `plan_skeleton` planner tool). Mutations land first; the spoken summary is the *next* turn after `function_call_output`.
- **Audio ducking.** While a response is in-flight and the first relevant store mutation hasn't committed yet, duck the assistant's output gain to 0 in `<audio>` and release once the mutation lands. Adds <120ms perceived latency in the worst case but keeps the visual-first promise.
- **"Heard you" state instantly** on `input_audio_buffer.speech_stopped` — the orb flips to THINKING with a "planning…" micro-copy chip, so perceived latency drops even when audio takes 1.5s.

### 14.3 Scheduler, not raw mutators

`add_activity` cannot be a blind setter. New tool layer in `lib/realtime/scheduler.ts`:

- Reject hard collisions with `fixed_event` (meetings, flights, check-ins).
- Reject scheduling outside an activity's `available_hours` or on its `closed_days`.
- Auto-insert transit buffer using a `transit_time_matrix` per destination.
- Return `{ ok: false, conflict: { kind, with }, alternatives: [...] }` so the model can pivot aloud.
- New planner tools: `plan_day(day_index, mood, constraints)` for one-shot day filling; `suggest_slots(activity_id)` for "where can this go?" probes; `validate_itinerary()` for a final pre-finalize sweep.
- `parking_lot` only holds activities that the scheduler couldn't place; surfaced in the canvas as "Possible adds".

### 14.4 Latency: realistic targets

Codex called the 800ms p50 too optimistic. Updated targets after measuring:

| Path | Realistic p50 | What we ship |
|---|---|---|
| Simple spoken reply ("yes/no") | 1.0–1.4s | Accept; the "heard you" THINKING badge masks it |
| Tool-first turn (skeleton paint) | 1.8–3.0s | Audio ducked; canvas paints in ~600ms after speech stops; spoken summary follows |
| Continued conversation, audio only | 0.8–1.3s | Should feel snappy after the first turn (warm route, warm prompt cache) |

Levers: short `max_output_tokens` for speech turns (~80), preloaded images, no cold serverless on first call (warmer route), `semantic_vad` `eagerness: "high"` for fast end-of-turn.

### 14.5 Security — durable, not in-memory

In-memory token-bucket on `/api/realtime/session` resets on every Vercel cold start. Replace with:

- **Vercel KV (Upstash Redis)** for rate limit counters: `mint:{ip}:{minute}` capped at 10, `mint:{fingerprint}:{day}` capped at 50.
- Strict origin allow-list on the route handler (drop requests whose `Origin` isn't ours).
- For the public share link: anyone with the URL can read; nobody can mint a fresh session by visiting the share URL.
- CSP header (Next.js middleware): `default-src 'self'; connect-src 'self' https://api.openai.com wss://api.openai.com; media-src 'self' blob:; img-src 'self' data: https://images.unsplash.com; script-src 'self'; style-src 'self' 'unsafe-inline'; font-src 'self' data:`.
- `Permissions-Policy: microphone=(self), camera=()`.
- Log every mint with sanitized IP + UA + outcome to `console.info`; in prod, ship to Vercel logs.

### 14.6 Mock data — required field expansion

The original schema is too thin to power realistic constraint reasoning. Updated activity shape:

```ts
{
  id, name, area_id, kind: "activity"|"food"|"stay"|"experience",
  duration_min: { typical, min, max },
  best_time: ["morning"|"afternoon"|"evening"|"sunset"|"late_night"],
  available_hours: [{ open: "HH:mm", close: "HH:mm" }],   // per-day if needed
  closed_days: ["wed"|"sun"|...],
  seasonal: { open_months: [3,4,5,...], notes: "monsoon June-Sept" },
  booking_required: boolean,
  intensity: "chill"|"moderate"|"active",
  indoor_outdoor: "indoor"|"outdoor"|"mixed",
  rain_fallback: boolean,
  weather_sensitive: boolean,
  kid_friendly: boolean,
  mobility: "high"|"moderate"|"low",
  crowd_level: { weekday: 1-5, weekend: 1-5 },
  price_band: 1-4,
  tags: string[],
  image, blurb,
  pair_avoid: [activity_id],   // "don't pair with X same day"
  source_notes: string,        // human-written authentic detail
}
```

Per-destination required additions:

- `transit_time_matrix`: minutes between every area pair.
- `canonical_day_templates`: 3–5 hand-written day archetypes ("North Goa chill day", "Panjim heritage half-day", "Old Goa + Spice plantation").
- `seasonal_warnings`: e.g. Goa monsoon flag June–Sept, Dubai heat May–Sept indoor pivot.

### 14.7 Accessibility — concrete additions

- `aria-live="polite"` region announces every store mutation: "Day 2 meeting added at 15:00 in Panjim."
- Live captions for assistant audio: pinned-to-bottom, large type, toggleable.
- Full keyboard parity: text-input fallback that produces identical `conversation.item.create` events; tab order: orb → transcript → trip header → day strip → first day card.
- Visible focus rings (3px, navy), no `outline: none` anywhere.
- Reduced-motion preference: disables Ken Burns, parallax, orb amplitude pulse (keeps state-color changes only).
- Mic permission denied path is a first-class UX, not a fallback — same tools, same store, just typed.
- Accessible names on every interactive: `<button aria-label="Press to plan your trip with voice">`.

---

## 15. Post-MVP scope (Phase 9+, after the 5-destination demo is rock-solid)

User-requested follow-on capabilities. Captured here so we don't lose them. **Not built until §10 phases 1–8 are landed and the canonical demo runs cleanly five times.**

### 15.1 Continued voice editing on a finalized trip

After `finalize_itinerary` lands, the user is on `/trip/[id]`. The voice orb persists. New tools the realtime session has access to in this mode:

- `unlock_for_edit()` — flips status back to "draft" (with an undo toast).
- All existing mutators continue to work; mutations re-publish to the share URL.
- `summarize_day(day_index)` — model spoken summary of any day.
- `answer_about_trip(query)` — RAG-lite: model answers questions about the current itinerary using the in-memory state ("when's my meeting?", "what's the chill day?", "remind me where I'm staying").

### 15.2 Export

- **PDF**: server-rendered via `@react-pdf/renderer` from the same itinerary JSON; nice typography, hero image per day. Triggered by voice ("export as PDF") or button.
- **ICS**: each day's activities + fixed events as VEVENTs in one `.ics` file, with location, description, and image URL. Importable into any calendar.
- **Share link** is already covered in §12.

### 15.3 Google Calendar integration (bidirectional)

The killer feature: assistant pre-knows your existing commitments and writes the trip back when finalized.

**Read direction (smarter questions):**

- OAuth scope: `https://www.googleapis.com/auth/calendar.readonly` (read only at first; we'll widen if writing back).
- On connect, fetch events in the trip-date range. Hand them to the model as a compact `existing_commitments` block in `session.update.instructions` for that conversation, e.g.:
  ```
  Existing commitments during May 15–19:
  - 2026-05-16 10:00–11:00 "Quarterly review" (video)
  - 2026-05-16 15:00–16:00 "Meeting with Anand" @ Panjim, Goa
  - 2026-05-18 09:00–09:30 "Dentist follow-up" (video)
  ```
- The model now asks better questions: "I see you have Quarterly review video at 10 on day 2 — should I plan day 2 morning around video calls and only schedule outdoor stuff after 11?"
- The model treats calendar events as `fixed_event`s so the scheduler respects them.

**Write direction (sync trip back):**

- Scope: `https://www.googleapis.com/auth/calendar.events`.
- New tool `sync_to_calendar({ calendar_id })` — writes each day's plan as events in a chosen calendar (default: a new "Goa May 15–19" calendar so it's revertible).
- Idempotency: every event tagged with `extendedProperties.private.tineri_trip_id = <share_id>`. Re-sync diff-merges instead of duplicating.

**Demo strategy** (decided 2026-04-25): build both real OAuth and a mock fixture; the demo recording uses mock by default (`NEXT_PUBLIC_CALENDAR_MODE=mock`), live OAuth is one env-var flip away. Mock fixture has the Panjim meeting pre-seeded so the calendar-awareness moment lands on camera without consent-screen friction.

**Edit-after-finalize behavior (decided 2026-04-25):** the orb stays visible on `/trip/[id]` and the trip is *always* voice-editable — no explicit unlock step. Mutations debounce-save to the share URL; finalized status is visual polish, not a hard lock. A subtle pulsing rim on the orb signals "live edit" mode.

**Calendar context depth (decided 2026-04-25):** events injected to the model as `{ id, title, start_local, end_local, location, has_video }` — attendees and descriptions are stripped server-side before the prompt is built. Title is preserved so the model can say "your Panjim meeting" naturally.

---

## 16. Calendar source: browser-use, not Google API (decision 2026-04-25)

User reversed the Phase-10 plan: instead of Google Calendar OAuth, drive a real browser via [browser-use](https://github.com/browser-use/browser-use) — a Playwright + LLM agent that opens calendar.google.com like a person would, reads the week, and extracts events. **Tasks #18 (OAuth read) and #19 (OAuth write) are superseded.** New tasks #21–#24 cover the replacement.

### 16.1 Why browser-use over the API

- No Google Cloud Console, no OAuth consent screen, no scope review.
- Works for any logged-in Google account immediately.
- Demos as agentic theater: "watch Tineri open my calendar and figure out my week".
- DOM-stable enough for a demo; the model handles minor layout drift.

Trade-offs we accept: ~5–15s per fetch (vs <1s for API), needs a persistent Chrome profile, can't run on Vercel serverless (the Python service runs on the demo machine).

### 16.2 Architecture

```
┌── services/calendar-bridge/ (Python, port 8765) ────────────────┐
│   FastAPI                                                        │
│   ├─ POST /events { start, end } → RedactedEvent[]               │
│   ├─ GET  /health  → { ok, signed_in }                           │
│   └─ POST /setup   → opens headed Chrome for first-run login     │
│                                                                   │
│   browser-use agent ── Playwright ── Chromium (headless)          │
│                              │                                    │
│                              └── persistent profile               │
│                                  .browser-use/profile/            │
└──────────────────────────────────────────────────────────────────┘
         ▲
         │ server-side fetch
┌────────┴──────────────────────────────────────────────────────────┐
│ Next.js                                                            │
│   /api/calendar/events ── proxies to localhost:8765/events ──┐     │
│                           if bridge unreachable, falls back to│     │
│                           mock fixture                         │     │
└──────────────────────────────────────────────────────────────┴─────┘
```

CLI commands (added to `voice-itinerary/package.json` scripts):

- `pnpm calendar:setup` — runs `services/calendar-bridge/scripts/setup.py`. Opens a real visible Chrome, user signs into Google. Cookies persist to `.browser-use/profile/`. One-time per machine.
- `pnpm calendar:bridge` — starts FastAPI on :8765 (headless from this point on).
- `pnpm dev` — unchanged. Next.js auto-detects bridge availability via `/health` ping.

### 16.3 Smart-questioning rules (prompt update, ships immediately)

The model treats `existing_commitments[i].has_video` as a behavioral switch:

- **`has_video: true`** — call is online. The user must be near power, wifi, and a quiet room. Do NOT schedule outdoor or transit-heavy activities in the ±60min window. Say something like *"Your standup at 9:30 is on video — keeping you in the cafe with good wifi until 10am, then we can hit the beach."*
- **`has_video: false` and `location` is set** — in-person meeting. Anchor the whole day around it. Pick a stay near the location, leave 60min transit buffer before and 30min after. Say *"Your meeting at Panjim is in person — making that the spine of day 2 and putting you in a Panjim hotel the night before."*
- **Neither** — ambiguous. Ask once: "Is that meeting in person or video?"

Token-efficient: 80 lines added to the system prompt, conditional on commitments being present.

### 16.4 Privacy + safety

- Cookies and storage live ONLY on the user's machine in `.browser-use/profile/`. Gitignored.
- The Python service is loopback-only (binds to 127.0.0.1, never 0.0.0.0). No external access.
- The agent is given a tightly scoped task ("extract events between dates A and B") — no free-form browsing.
- We strip attendees and descriptions BEFORE returning JSON. The realtime model never sees them.
- Same `OPENAI_API_KEY` powers browser-use (it uses an OpenAI vision/text model under the hood). One key, two systems.

### 16.5 Demo strategy

- Mock calendar (`NEXT_PUBLIC_CALENDAR_MODE=mock`) remains the safest recording fallback — Task #20 already shipped.
- Browser-use is the "live" story. For the recording: run `pnpm calendar:setup` once before camera rolls, then demo the full pipeline.
- If the browser-use path fails mid-demo, the route handler silently falls back to the mock fixture so the conversation never breaks.

### 15.4 Personalization memory (longer-term)

- Persist user preferences across trips: dietary, mobility, hated activities, beloved cuisines.
- Surface in subsequent sessions: "I'll skip seafood for you again this trip" — earns trust fast.
- Storage: Vercel KV keyed by signed-in user (Google), no PII beyond preferences.

### 15.5 Multi-modal assists (stretch)

- Voice-driven map view: "show me day 3 on a map" → side panel with pinned activities, route polylines, transit-time ETAs.
- Photo-driven: "I want my trip to look like this" → user uploads an image → CLIP-style embedding picks matching destinations from the catalog.
- Booking handoffs: after finalize, deep-link to Booking.com / Skyscanner / Klook with pre-filled queries — we don't book, we hand off.
