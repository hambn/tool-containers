#!/usr/bin/env python3
"""Render only documented, unexpired CVE exceptions for one catalog image."""

import argparse
import datetime as dt
import json
from pathlib import Path
import re

from image_plan import ROOT, load_catalog


EXCEPTIONS = ROOT / ".github/vulnerability-exceptions.json"


def entries(today):
    images = {image["id"] for image in load_catalog()}
    records = json.loads(EXCEPTIONS.read_text())
    seen = set()
    for item in records:
        if set(item) != {"image", "id", "reason", "owner", "expires"}:
            raise ValueError(f"invalid exception fields: {item}")
        if item["image"] not in images or not re.fullmatch(r"CVE-\d{4}-\d{4,}", item["id"]):
            raise ValueError(f"invalid exception image or CVE: {item}")
        if not isinstance(item["reason"], str) or len(item["reason"].strip()) < 15:
            raise ValueError(f"exception needs a concrete reason: {item}")
        if not isinstance(item["owner"], str) or not item["owner"].strip():
            raise ValueError(f"exception needs an owner: {item}")
        expiry = dt.date.fromisoformat(item["expires"])
        if expiry < today:
            raise ValueError(f"expired exception: {item['image']} {item['id']}")
        key = (item["image"], item["id"])
        if key in seen:
            raise ValueError(f"duplicate exception: {key}")
        seen.add(key)
    return records


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--image", required=True)
    parser.add_argument("--output", required=True)
    args = parser.parse_args()
    if args.image not in {image["id"] for image in load_catalog()}:
        raise ValueError(f"unknown image: {args.image}")
    selected = [item for item in entries(dt.datetime.now(dt.timezone.utc).date())
                if item["image"] == args.image]
    lines = [f"# {item['reason']} (owner {item['owner']}; expires {item['expires']})\n{item['id']}\n"
             for item in selected]
    Path(args.output).write_text("".join(lines))


if __name__ == "__main__":
    main()
