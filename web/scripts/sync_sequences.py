"""Publish recorded sign sequences to the frontend.

The browser cannot list a directory, so this copies data/sequences/*.json into
the Vite public folder and writes an index.json describing what is available.

Run it after recording new takes with record_sign_sequence.py:

    python web/scripts/sync_sequences.py
"""

import json
import re
import shutil
from collections import defaultdict
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]
SOURCE_DIR = REPO_ROOT / "data" / "sequences"
TARGET_DIR = REPO_ROOT / "web" / "frontend" / "public" / "sequences"

TAKE_PATTERN = re.compile(r"^(?P<word>.+)_(?P<index>\d+)\.json$")


def main():
    TARGET_DIR.mkdir(parents=True, exist_ok=True)

    # Clear previously published takes so deleted recordings do not linger.
    for stale in TARGET_DIR.glob("*.json"):
        stale.unlink()

    takes = defaultdict(list)
    copied = 0

    if SOURCE_DIR.is_dir():
        for path in sorted(SOURCE_DIR.glob("*.json")):
            match = TAKE_PATTERN.match(path.name)
            if not match:
                print(f"Skipping {path.name}: unexpected filename format.")
                continue

            try:
                with open(path, encoding="utf-8") as f:
                    payload = json.load(f)
            except json.JSONDecodeError as exc:
                print(f"Skipping {path.name}: invalid JSON ({exc}).")
                continue

            if not payload.get("frames"):
                print(f"Skipping {path.name}: no frames recorded.")
                continue

            word = str(payload.get("word") or match.group("word")).strip().lower()
            shutil.copy2(path, TARGET_DIR / path.name)
            takes[word].append(path.name)
            copied += 1

    index = {
        "words": sorted(takes.keys()),
        "takes": {word: sorted(files) for word, files in takes.items()},
    }

    with open(TARGET_DIR / "index.json", "w", encoding="utf-8") as f:
        json.dump(index, f, indent=2, ensure_ascii=False)

    print(f"Published {copied} take(s) across {len(index['words'])} word(s) to {TARGET_DIR}")
    if not index["words"]:
        print(
            "\nNo sequences found. Record some with record_sign_sequence.py "
            "(select a word, SPACE to start and stop a take), then re-run this script."
        )
    else:
        print("Words: " + ", ".join(index["words"]))


if __name__ == "__main__":
    main()
