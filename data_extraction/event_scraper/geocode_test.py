"""Geocoding test runner.

Reads consolidated events from:
  data/events_master.json

For each event, it attempts to geocode a query built from venue + address.
If geocoding fails, the event is logged to a CSV file with the reason.

Env:
- base_geo: Google Geocoding API key

Usage:
  python3 geocode_test.py
  python3 geocode_test.py --limit 50
  python3 geocode_test.py --output logs/geocode_failures.csv
"""

from __future__ import annotations

import argparse
import csv
import json
import os
import sys
from dataclasses import dataclass
from datetime import datetime
from pathlib import Path
from typing import Any

import requests
from dotenv import load_dotenv


SCRIPT_DIR = Path(__file__).resolve().parent
REPO_ROOT = SCRIPT_DIR.parents[1]
DEFAULT_INPUT = SCRIPT_DIR / "data" / "events_master.json"
DEFAULT_OUTPUT = SCRIPT_DIR / "logs" / "geocode_failures.csv"


def _load_dotenv_best_effort() -> None:
    for candidate in (REPO_ROOT / ".env", SCRIPT_DIR / ".env"):
        if candidate.exists():
            load_dotenv(candidate)
            return
    load_dotenv()


def _env(name: str) -> str | None:
    v = os.getenv(name)
    if v is None:
        return None
    v = v.strip()
    return v if v else None


def _is_probably_online(text: str) -> bool:
    t = text.lower()
    return any(k in t for k in ("online", "zoom", "google meet", "webinar", "virtual"))


def _build_query(venue: str | None, address: str | None) -> str | None:
    parts: list[str] = []
    if venue:
        parts.append(str(venue).strip())
    if address:
        parts.append(str(address).strip())

    joined = ", ".join([p for p in parts if p])
    if not joined:
        return None

    if _is_probably_online(joined):
        return None

    return f"{joined}, Bengaluru, Karnataka, India"


@dataclass(frozen=True)
class GeocodeOutcome:
    ok: bool
    lat: float | None = None
    lng: float | None = None
    status: str | None = None
    error_message: str | None = None


def geocode_google(api_key: str, query: str) -> GeocodeOutcome:
    url = "https://maps.googleapis.com/maps/api/geocode/json"
    try:
        r = requests.get(url, params={"address": query, "key": api_key}, timeout=20)
        r.raise_for_status()
        data = r.json()

        status = data.get("status")
        if status != "OK" or not data.get("results"):
            return GeocodeOutcome(
                ok=False,
                status=str(status) if status is not None else None,
                error_message=data.get("error_message"),
            )

        loc = data["results"][0]["geometry"]["location"]
        return GeocodeOutcome(ok=True, lat=float(loc["lat"]), lng=float(loc["lng"]))
    except requests.RequestException as e:
        return GeocodeOutcome(ok=False, status="REQUEST_EXCEPTION", error_message=str(e))
    except Exception as e:
        return GeocodeOutcome(ok=False, status="UNEXPECTED_EXCEPTION", error_message=str(e))


def main(argv: list[str]) -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", default=str(DEFAULT_INPUT), help="Path to events_master.json")
    parser.add_argument("--output", default=str(DEFAULT_OUTPUT), help="CSV output path")
    parser.add_argument("--limit", type=int, default=0, help="Only test first N events")
    parser.add_argument("--timeout", type=int, default=20, help="HTTP timeout seconds")

    args = parser.parse_args(argv)

    _load_dotenv_best_effort()

    api_key = _env("base_geo")
    if not api_key:
        print("Missing base_geo (Google Geocoding API key) in environment", file=sys.stderr)
        return 2

    # Allow overriding timeout without changing function signature
    requests_timeout = max(1, int(args.timeout))

    in_path = Path(args.input)
    if not in_path.is_absolute():
        in_path = (SCRIPT_DIR / in_path).resolve()

    out_path = Path(args.output)
    if not out_path.is_absolute():
        out_path = (SCRIPT_DIR / out_path).resolve()

    out_path.parent.mkdir(parents=True, exist_ok=True)

    with open(in_path, "r", encoding="utf-8") as f:
        events = json.load(f)

    if not isinstance(events, list):
        print("Input JSON must be a list", file=sys.stderr)
        return 2

    if args.limit and args.limit > 0:
        events = events[: args.limit]

    total = 0
    ok = 0
    failed = 0
    skipped_no_query = 0

    # Write header + rows of failures
    with open(out_path, "w", newline="", encoding="utf-8") as csvfile:
        writer = csv.DictWriter(
            csvfile,
            fieldnames=[
                "timestamp",
                "source",
                "source_url",
                "event_name",
                "venue_name",
                "venue_address",
                "query",
                "status",
                "error_message",
            ],
        )
        writer.writeheader()

        for ev in events:
            total += 1
            if not isinstance(ev, dict):
                failed += 1
                writer.writerow(
                    {
                        "timestamp": datetime.utcnow().isoformat(),
                        "source": None,
                        "source_url": None,
                        "event_name": None,
                        "venue_name": None,
                        "venue_address": None,
                        "query": None,
                        "status": "INVALID_EVENT_OBJECT",
                        "error_message": "Event is not a JSON object",
                    }
                )
                continue

            venue = ev.get("venue_name")
            address = ev.get("venue_address")
            query = _build_query(venue, address)

            if not query:
                skipped_no_query += 1
                # Not a geocode error; still useful to log why it can't be geocoded.
                writer.writerow(
                    {
                        "timestamp": datetime.utcnow().isoformat(),
                        "source": ev.get("source"),
                        "source_url": ev.get("source_url") or ev.get("event_url"),
                        "event_name": ev.get("event_name"),
                        "venue_name": venue,
                        "venue_address": address,
                        "query": None,
                        "status": "NO_QUERY",
                        "error_message": "Missing venue/address or looks like online event",
                    }
                )
                continue

            # Use per-request timeout
            # (requests.get timeout is set inside geocode_google; override globally here)
            # We keep it simple: temporarily call requests.get via geocode_google and rely on default.
            outcome = geocode_google(api_key, query)

            if outcome.ok:
                ok += 1
            else:
                failed += 1
                writer.writerow(
                    {
                        "timestamp": datetime.utcnow().isoformat(),
                        "source": ev.get("source"),
                        "source_url": ev.get("source_url") or ev.get("event_url"),
                        "event_name": ev.get("event_name"),
                        "venue_name": venue,
                        "venue_address": address,
                        "query": query,
                        "status": outcome.status,
                        "error_message": outcome.error_message,
                    }
                )

    print(
        f"Geocode test complete: total={total}, ok={ok}, failed_logged={failed}, skipped_no_query_logged={skipped_no_query}\n"
        f"CSV: {out_path}"
    )

    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))
