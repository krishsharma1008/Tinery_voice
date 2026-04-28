"""Persistent Playwright browser context bound to a local profile directory.

The profile lives at services/calendar-bridge/.browser-use/profile/ and holds
the user's Google login cookies. After running scripts/setup.py once, the
headless service can read calendar.google.com without a fresh login.
"""

from __future__ import annotations

import os
from pathlib import Path

from playwright.async_api import (
    BrowserContext,
    Playwright,
    async_playwright,
)

ROOT = Path(__file__).resolve().parent.parent
PROFILE_DIR = ROOT / ".browser-use" / "profile"
PROFILE_DIR.mkdir(parents=True, exist_ok=True)


async def open_context(headless: bool = True) -> tuple[Playwright, BrowserContext]:
    """Open a Chromium context with the persistent profile.

    Caller is responsible for closing both the context and the Playwright
    instance.
    """
    p = await async_playwright().start()
    context = await p.chromium.launch_persistent_context(
        user_data_dir=str(PROFILE_DIR),
        headless=headless,
        viewport={"width": 1280, "height": 900},
        args=[
            "--disable-blink-features=AutomationControlled",
        ],
        accept_downloads=False,
        ignore_https_errors=False,
        locale="en-US",
    )
    return p, context


async def is_signed_in() -> bool:
    """Cheap probe: open calendar.google.com headlessly and check whether the
    URL stays on calendar.google.com (signed in) vs redirects to accounts.google.com
    (signed out)."""
    if not any(PROFILE_DIR.iterdir()):
        return False
    p, context = await open_context(headless=True)
    try:
        page = await context.new_page()
        try:
            await page.goto(
                "https://calendar.google.com/calendar/u/0/r",
                timeout=15_000,
                wait_until="domcontentloaded",
            )
        except Exception:
            return False
        url = page.url
        return "calendar.google.com" in url and "accounts.google.com" not in url
    finally:
        await context.close()
        await p.stop()


def profile_path() -> str:
    return str(PROFILE_DIR)


def has_openai_key() -> bool:
    return bool(os.environ.get("OPENAI_API_KEY"))
