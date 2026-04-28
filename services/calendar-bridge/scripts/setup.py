"""One-time login flow.

Run with:  uv run python scripts/setup.py

Opens a real visible Chrome at calendar.google.com. You sign in. The
session cookies are persisted to .browser-use/profile/. After that the
service can run headlessly indefinitely (until cookies expire).

The script DOES NOT automate the login — Google will block any agentic
sign-in flow. The user is expected to type their password and approve any
2FA prompt manually.
"""

from __future__ import annotations

import asyncio
import sys
from pathlib import Path

from dotenv import load_dotenv

# Load OPENAI_API_KEY from a sibling .env.local if present (parity with bridge/main.py).
_HERE = Path(__file__).resolve().parent.parent
for candidate in (
    _HERE / ".env",
    _HERE.parent.parent / "voice-itinerary" / ".env.local",
):
    if candidate.exists():
        load_dotenv(candidate, override=False)
        break

from bridge.session import open_context  # noqa: E402  (load env first)


async def main() -> None:
    print("[setup] opening Chrome — please sign into your Google account")
    print("[setup] when calendar.google.com loads with your events, press Enter here")
    p, context = await open_context(headless=False)
    try:
        page = await context.new_page()
        await page.goto("https://calendar.google.com/calendar/u/0/r")
        try:
            input("[setup] hit Enter once you can see your real calendar > ")
        except (KeyboardInterrupt, EOFError):
            print("\n[setup] cancelled")
            sys.exit(1)
        # Probe to confirm we landed on calendar (not signin)
        url = page.url
        if "accounts.google.com" in url:
            print("[setup] still on accounts.google.com — sign-in not completed")
            sys.exit(2)
        print(f"[setup] looks good — current URL: {url}")
        print("[setup] cookies persisted. You can now run `pnpm calendar:bridge`.")
    finally:
        await context.close()
        await p.stop()


if __name__ == "__main__":
    asyncio.run(main())
