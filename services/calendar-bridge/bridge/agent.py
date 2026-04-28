"""browser-use agent that extracts Google Calendar events for a date range.

The agent navigates Google Calendar like a human, opens events one by one,
and records the fields Tineri Voice cares about. Attendees and descriptions
are NEVER extracted (so they can't be leaked downstream).
"""

from __future__ import annotations

import json
import os
import time
from datetime import datetime
from typing import Any

from browser_use import Agent, Browser
from browser_use.llm import ChatOpenAI

from .redact import to_redacted_event
from .session import PROFILE_DIR

# In-memory cache: (start, end) -> (timestamp, events)
_CACHE: dict[tuple[str, str], tuple[float, list[dict[str, Any]]]] = {}
CACHE_TTL_S = 300  # 5 min


AGENT_TASK_TEMPLATE = """\
You are a calendar reader. Open Google Calendar at
https://calendar.google.com/calendar/u/0/r/week/{year}/{month}/{day}
(viewing the week that contains {start_date}).

For each event whose start date falls within the closed range
[{start_date}, {end_date}] inclusive:
  1. Click the event to open the popup.
  2. Read: title, start time, end time, location (if any), and whether the
     popup shows a "Join with Google Meet" button OR a Zoom/Teams link
     (this means has_video=true).
  3. Close the popup.

DO NOT extract attendees. DO NOT extract event descriptions. DO NOT click
"Yes/Maybe/No" RSVP buttons. DO NOT modify any event.

When you have processed every event in the date range across the visible
weeks (you may need to advance to the next week using the right-arrow
button), return your result as a single JSON code block with this exact
shape:

```json
{{
  "events": [
    {{
      "id": "<short slug>",
      "title": "<event title>",
      "start_local": "YYYY-MM-DDTHH:MM",
      "end_local":   "YYYY-MM-DDTHH:MM",
      "location": "<string or null>",
      "has_video": true|false
    }}
  ]
}}
```

If the calendar shows you are signed out, return:
```json
{{ "error": "signed_out" }}
```
"""


def _build_task(start_date: str, end_date: str) -> str:
    dt = datetime.fromisoformat(start_date)
    return AGENT_TASK_TEMPLATE.format(
        start_date=start_date,
        end_date=end_date,
        year=dt.year,
        month=dt.month,
        day=dt.day,
    )


def _parse_agent_output(raw: str) -> dict[str, Any]:
    """Pull the JSON block out of the agent's final message."""
    # Look for ```json ... ``` first; fall back to first { ... } block.
    fence = "```json"
    if fence in raw:
        start = raw.index(fence) + len(fence)
        end = raw.index("```", start)
        return json.loads(raw[start:end].strip())
    # Fallback
    s = raw.find("{")
    e = raw.rfind("}")
    if s == -1 or e == -1 or e <= s:
        raise ValueError("No JSON in agent output")
    return json.loads(raw[s : e + 1])


async def fetch_events(
    start_date: str, end_date: str
) -> dict[str, Any]:
    """Return { ok: True, events: [...] } or { ok: False, reason }."""
    key = (start_date, end_date)
    now = time.time()
    cached = _CACHE.get(key)
    if cached and now - cached[0] < CACHE_TTL_S:
        return {"ok": True, "events": cached[1], "cached": True}

    if not os.environ.get("OPENAI_API_KEY"):
        return {"ok": False, "reason": "missing_openai_key"}

    llm = ChatOpenAI(model="gpt-4o", temperature=0.0)
    browser = Browser(
        headless=True,
        user_data_dir=str(PROFILE_DIR),
    )

    agent = Agent(
        task=_build_task(start_date, end_date),
        llm=llm,
        browser=browser,
        use_vision=True,
        max_failures=2,
    )

    try:
        result = await agent.run(max_steps=30)
    except Exception as exc:  # noqa: BLE001
        return {"ok": False, "reason": f"agent_error: {exc!s}"}
    finally:
        try:
            await browser.close()
        except Exception:  # noqa: BLE001
            pass

    final = (result.final_result() if hasattr(result, "final_result") else None) or ""
    if not final:
        return {"ok": False, "reason": "no_final_message"}

    try:
        parsed = _parse_agent_output(final)
    except Exception as exc:  # noqa: BLE001
        return {"ok": False, "reason": f"parse_error: {exc!s}", "raw": final[:400]}

    if "error" in parsed:
        return {"ok": False, "reason": parsed["error"]}

    events = [to_redacted_event(e) for e in parsed.get("events", [])]
    _CACHE[key] = (now, events)
    return {"ok": True, "events": events, "cached": False}
