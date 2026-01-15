import json
import os
from datetime import datetime

MASTER_FILE = "data/allevents_master.json"
TEMP_FILE = "data/allevents_temp.json"


def load_json(path):
    if not os.path.exists(path):
        return []
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def save_json(path, data):
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)


def main():
    master_events = load_json(MASTER_FILE)
    temp_events = load_json(TEMP_FILE)

    master_map = {
        event["event_key"]: event
        for event in master_events
        if "event_key" in event
    }

    for event in temp_events:
        key = event.get("event_key")
        if not key:
            continue

        event["last_updated"] = datetime.utcnow().isoformat()
        master_map[key] = event  # overwrite or insert

    merged_events = list(master_map.values())

    save_json(MASTER_FILE, merged_events)

    print(f"✅ Merge complete")
    print(f"   Total events in master: {len(merged_events)}")
    print(f"   Temp events processed: {len(temp_events)}")


if __name__ == "__main__":
    main()
