#!/usr/bin/env python3
"""Load scraped events JSON into Supabase (Postgres) `public.events`.

This script is designed to work with the `data_extraction/event_scraper` Scrapy output:
- data/allevents.json
- data/eventbrite.json
- data/events_master.json (recommended input; produced by consolidate_events.py)

It:
1) reads the JSON list
2) maps fields into the backend DB schema
3) geocodes missing lat/long using Google Geocoding API (env var: base_geo)
4) upserts into Supabase using a stable unique key: `url`

Env vars (reads from process env; also loads a repo-root .env if present):
- SUPABASE_URL
- SUPABASE_KEY or SUPABASE_SERVICE_ROLE_KEY (recommended)
- base_geo (Google Geocoding API key)

Usage:
  python3 load_to_supabase.py
  python3 load_to_supabase.py --input data/events_master.json --limit 50
"""

from __future__ import annotations

import argparse
import json
import os
import sys
from dataclasses import dataclass
from datetime import datetime
from pathlib import Path
from typing import Any, Iterable

import requests
from dotenv import load_dotenv
from supabase import Client, create_client


SCRIPT_DIR = Path(__file__).resolve().parent
REPO_ROOT = SCRIPT_DIR.parents[1]
DEFAULT_INPUT = SCRIPT_DIR / "data" / "events_master.json"


def _load_dotenv_best_effort() -> None:
    """Load .env from repo root or current dir if present."""
    # Prefer repo-root .env so running from anywhere works.
    for candidate in (REPO_ROOT / ".env", SCRIPT_DIR / ".env"):
        if candidate.exists():
            load_dotenv(candidate)
            return
    load_dotenv()  # fallback: default search behavior


def _env(name: str) -> str | None:
    value = os.getenv(name)
    if value is None:
        return None
    value = value.strip()
    return value if value else None


@dataclass(frozen=True)
class GeocodeResult:
    lat: float
    lng: float


class GoogleGeocoder:
    def __init__(self, api_key: str):
        self.api_key = api_key
        self.base_url = "https://maps.googleapis.com/maps/api/geocode/json"

    def geocode(self, query: str) -> GeocodeResult | None:
        try:
            r = requests.get(
                self.base_url,
                params={"address": query, "key": self.api_key},
                timeout=20,
            )
            r.raise_for_status()
            data = r.json()
            if data.get("status") != "OK" or not data.get("results"):
                return None
            loc = data["results"][0]["geometry"]["location"]
            return GeocodeResult(lat=float(loc["lat"]), lng=float(loc["lng"]))
        except Exception:
            return None


def _combine_date_time(date_str: str | None, time_str: str | None) -> str | None:
    """Return an ISO-8601 timestamp string (naive) or None.

    We store timestamps without forcing timezone here; Postgres/Supabase will accept
    ISO strings. If you want exact TZ correctness, you can later switch to
    ZoneInfo('Asia/Kolkata') and emit offset-aware strings.
    """
    if not date_str:
        return None

    time_str = (time_str or "").strip()
    if not time_str:
        time_str = "00:00"

    # Most scraped times are HH:MM
    try:
        dt = datetime.strptime(f"{date_str} {time_str}", "%Y-%m-%d %H:%M")
    except Exception:
        try:
            dt = datetime.strptime(date_str, "%Y-%m-%d")
        except Exception:
            return None

    return dt.isoformat()


def _is_probably_online(text: str) -> bool:
    t = text.lower()
    return any(k in t for k in ("online", "zoom", "google meet", "webinar", "virtual"))


def _bangalore_query(venue: str | None, address: str | None) -> str | None:
    parts: list[str] = []
    if venue:
        parts.append(venue.strip())
    if address:
        parts.append(address.strip())
    joined = ", ".join([p for p in parts if p])
    if not joined:
        return None

    if _is_probably_online(joined):
        return None

    # Add city context to improve accuracy.
    return f"{joined}, Bengaluru, Karnataka, India"


def _to_db_row(event: dict[str, Any], geocoder: GoogleGeocoder | None) -> dict[str, Any] | None:
    """Map scraped event dict -> Supabase `events` row.

    Returns None if the event cannot be loaded (e.g., missing coords and cannot geocode).
    """
    name = event.get("event_name")
    if not name:
        return None

    url = event.get("event_url") or event.get("source_url")
    if not url:
        return None

    venue = event.get("venue_name")
    address = event.get("venue_address")

    lat = None
    lng = None

    # If your scraped data ever contains coords, respect them.
    if event.get("lat") is not None and event.get("long") is not None:
        try:
            lat = float(event["lat"])
            lng = float(event["long"])
        except Exception:
            lat = None
            lng = None

    if (lat is None or lng is None) and geocoder is not None:
        query = _bangalore_query(venue, address)
        if query:
            res = geocoder.geocode(query)
            if res:
                lat, lng = res.lat, res.lng

    # DB schema currently has NOT NULL lat/long. Skip if we cannot produce them.
    if lat is None or lng is None:
        return None

    startDate = _combine_date_time(event.get("start_date"), event.get("start_time"))
    endDate = _combine_date_time(event.get("end_date"), event.get("end_time"))

    row: dict[str, Any] = {
        "name": name,
        "description": event.get("description"),
        "url": url,
        "image": None,  # Scrapy spiders don't currently capture image
        "startDate": startDate,
        "endDate": endDate,
        "venue": venue,
        "address": address,
        "lat": lat,
        "long": lng,
        "organizer": event.get("organizer_name"),
    }

    return row


def _chunked(items: list[dict[str, Any]], size: int) -> Iterable[list[dict[str, Any]]]:
    for i in range(0, len(items), size):
        yield items[i : i + size]


def main(argv: list[str]) -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", default=str(DEFAULT_INPUT), help="Input JSON file (list of events)")
    parser.add_argument("--limit", type=int, default=0, help="Optional max events to load")
    parser.add_argument("--batch", type=int, default=200, help="Upsert batch size")
    parser.add_argument(
        "--skip-geocoding",
        action="store_true",
        help="Do not call Google geocoding (events without coords will be skipped)",
    )

    args = parser.parse_args(argv)

    _load_dotenv_best_effort()

    supabase_url = _env("SUPABASE_URL")
    supabase_key = _env("SUPABASE_KEY") or _env("SUPABASE_SERVICE_ROLE_KEY")

    if not supabase_url or not supabase_key:
        print("Missing SUPABASE_URL and SUPABASE_KEY (or SUPABASE_SERVICE_ROLE_KEY)", file=sys.stderr)
        return 2

    geocoder: GoogleGeocoder | None = None
    if not args.skip_geocoding:
        geo_key = _env("base_geo")
        if geo_key:
            geocoder = GoogleGeocoder(api_key=geo_key)
        else:
            print("base_geo not set; will skip events without coords", file=sys.stderr)

    in_path = Path(args.input)
    if not in_path.is_absolute():
        in_path = (SCRIPT_DIR / in_path).resolve()

    if not in_path.exists():
        print(f"Input file not found: {in_path}", file=sys.stderr)
        return 2

    events: list[dict[str, Any]]
    with open(in_path, "r", encoding="utf-8") as f:
        events = json.load(f)

    if not isinstance(events, list):
        print("Input JSON must be a list of events", file=sys.stderr)
        return 2

    if args.limit and args.limit > 0:
        events = events[: args.limit]

    client: Client = create_client(supabase_url, supabase_key)

    rows: list[dict[str, Any]] = []
    skipped = 0

    for ev in events:
        if not isinstance(ev, dict):
            skipped += 1
            continue

        row = _to_db_row(ev, geocoder)
        if row is None:
            skipped += 1
            continue
        rows.append(row)

    if not rows:
        print(f"No rows to upsert. Skipped={skipped}")
        return 0

    total_upserted = 0
    for batch in _chunked(rows, args.batch):
        # Requires a UNIQUE index/constraint on (url).
        client.table("events").upsert(batch, on_conflict="url").execute()
        total_upserted += len(batch)

    print(f"Upserted={total_upserted}, skipped={skipped}, input={len(events)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))
