"""FastAPI service exposing browser-use calendar extraction to Next.js.

Runs on 127.0.0.1:8765 only — never bind to 0.0.0.0. Per PLAN §16.4 the
service is loopback-only so the only thing that can call it is the local
Next.js dev server.
"""

from __future__ import annotations

import os
from contextlib import asynccontextmanager
from pathlib import Path

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from .agent import fetch_events
from .session import is_signed_in, profile_path

# Load OPENAI_API_KEY from either ./env or the sibling Next.js app's .env.local.
_HERE = Path(__file__).resolve().parent.parent
for candidate in (
    _HERE / ".env",
    _HERE.parent.parent / "voice-itinerary" / ".env.local",
):
    if candidate.exists():
        load_dotenv(candidate, override=False)
        break

# Allow Next.js dev origins only.
DEV_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]


@asynccontextmanager
async def lifespan(_: FastAPI):
    yield


app = FastAPI(title="Tineri calendar-bridge", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=DEV_ORIGINS,
    allow_credentials=False,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)


class EventsRequest(BaseModel):
    start: str = Field(..., description="ISO yyyy-mm-dd")
    end: str = Field(..., description="ISO yyyy-mm-dd")


@app.get("/health")
async def health() -> dict[str, object]:
    has_key = bool(os.environ.get("OPENAI_API_KEY"))
    try:
        signed = await is_signed_in()
    except Exception:  # noqa: BLE001
        signed = False
    return {
        "ok": True,
        "signed_in": signed,
        "has_openai_key": has_key,
        "profile": profile_path(),
    }


@app.post("/events")
async def events(req: EventsRequest) -> dict[str, object]:
    if not os.environ.get("OPENAI_API_KEY"):
        raise HTTPException(503, "missing_openai_key")
    result = await fetch_events(req.start, req.end)
    if not result.get("ok"):
        return {
            "source": "browser_use",
            "ok": False,
            "reason": result.get("reason"),
            "events": [],
        }
    return {
        "source": "browser_use",
        "ok": True,
        "events": result["events"],
        "cached": result.get("cached", False),
    }
