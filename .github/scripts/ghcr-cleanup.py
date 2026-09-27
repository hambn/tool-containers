#!/usr/bin/env python3
"""Delete old untagged GHCR versions that no tagged image still references.

Usage: ghcr-cleanup.py [--dry-run] <package>...
Keeps every tagged version, every manifest reachable from a tagged index, every
version younger than --min-age-days, and every manifest with an OCI `subject`
(signatures and attestations stored as referrers). Cosign `sha256-<digest>`
fallback tags whose subject image is gone count as untagged. Requires `gh` authenticated
with packages write and `docker login ghcr.io`.
"""

from __future__ import annotations

import argparse
import datetime
import json
import subprocess
import sys

OWNER = "hambn"


def versions(package: str) -> list[dict]:
    output = subprocess.run(
        ["gh", "api", "--paginate", "--jq", ".[]", f"/users/{OWNER}/packages/container/{package}/versions"],
        check=True, capture_output=True, text=True,
    ).stdout
    return [json.loads(line) for line in output.splitlines() if line]


def manifest(package: str, digest: str) -> dict | None:
    """Return the raw manifest, or None when the registry no longer has it."""
    result = subprocess.run(
        ["docker", "buildx", "imagetools", "inspect", "--raw", f"ghcr.io/{OWNER}/{package}@{digest}"],
        capture_output=True, text=True,
    )
    if result.returncode != 0:
        if "not found" in result.stderr:
            return None
        sys.exit(f"inspect {package}@{digest} failed: {result.stderr.strip()}")
    return json.loads(result.stdout)


def is_orphan_referrer_tag(package: str, tags: list[str]) -> bool:
    """True for a cosign `sha256-<digest>` fallback tag whose subject is gone."""
    return all(
        tag.startswith("sha256-") and manifest(package, "sha256:" + tag.removeprefix("sha256-")) is None
        for tag in tags
    )


def referenced(package: str, roots: list[str]) -> set[str]:
    seen: set[str] = set()
    pending = list(roots)
    while pending:
        digest = pending.pop()
        if digest in seen:
            continue
        seen.add(digest)
        found = manifest(package, digest)
        if found is not None:
            pending.extend(child["digest"] for child in found.get("manifests", []))
    return seen


def clean(package: str, min_age: datetime.timedelta, dry_run: bool) -> None:
    all_versions = versions(package)
    tagged = [
        v["name"] for v in all_versions
        if (tags := v["metadata"]["container"]["tags"]) and not is_orphan_referrer_tag(package, tags)
    ]
    keep = referenced(package, tagged)
    cutoff = datetime.datetime.now(datetime.timezone.utc) - min_age
    for version in all_versions:
        digest = version["name"]
        updated = datetime.datetime.fromisoformat(version["updated_at"].replace("Z", "+00:00"))
        if digest in keep or updated > cutoff or "subject" in (manifest(package, digest) or {}):
            continue
        print(f"{'would delete' if dry_run else 'deleting'} {package}@{digest} ({version['updated_at']})")
        if not dry_run:
            subprocess.run(
                ["gh", "api", "--method", "DELETE",
                 f"/users/{OWNER}/packages/container/{package}/versions/{version['id']}"],
                check=True, capture_output=True,
            )


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument("--min-age-days", type=int, default=14)
    parser.add_argument("packages", nargs="+")
    args = parser.parse_args()
    for package in args.packages:
        clean(package, datetime.timedelta(days=args.min_age_days), args.dry_run)
    return 0


if __name__ == "__main__":
    sys.exit(main())
