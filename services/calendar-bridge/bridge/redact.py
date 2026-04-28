"""Strip sensitive fields from extracted events BEFORE the realtime model
ever sees them. Per PLAN §16.4, attendees and descriptions never leave
this service."""

from __future__ import annotations

import re
from typing import Any

# Heuristic redaction for personal-data-shaped strings inside titles.
EMAIL_RE = re.compile(r"[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}")
PHONE_RE = re.compile(r"\+?\d[\d\s().-]{7,}")


def redact_title(title: str) -> str:
    if not title:
        return "Meeting"
    cleaned = EMAIL_RE.sub("[email]", title)
    cleaned = PHONE_RE.sub("[phone]", cleaned)
    return cleaned.strip() or "Meeting"


def to_redacted_event(raw: dict[str, Any]) -> dict[str, Any]:
    """Project an extracted event onto the wire shape the model sees."""
    return {
        "id": raw.get("id") or raw.get("event_id") or "",
        "title": redact_title(str(raw.get("title", ""))),
        "start_local": raw["start_local"],
        "end_local": raw["end_local"],
        "location": raw.get("location") or None,
        "has_video": bool(raw.get("has_video", False)),
    }
