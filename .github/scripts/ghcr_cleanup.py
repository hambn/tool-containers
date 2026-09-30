"""Prune old GHCR versions while preserving tagged indexes and their children."""

from __future__ import annotations

import argparse
import json
import re
from dataclasses import dataclass
from datetime import UTC, datetime, timedelta
from typing import Any
from urllib.parse import quote

from ci import output, run
from image_common import digest

FALLBACK_TAG = re.compile(r"sha256-([0-9a-f]{64})(?:\.(?:sig|att|sbom))?")


@dataclass(frozen=True)
class PackageVersion:
    id: int
    digest: str
    tags: tuple[str, ...]
    updated: datetime

    @classmethod
    def parse(cls, document: dict[str, Any]) -> PackageVersion:
        updated = datetime.fromisoformat(document["updated_at"].replace("Z", "+00:00"))
        if updated.tzinfo is None:
            raise ValueError("GHCR version timestamps must include a timezone")
        return cls(
            document["id"],
            digest(document["name"]),
            tuple(document["metadata"]["container"]["tags"]),
            updated,
        )


class Package:
    def __init__(self, owner: str, name: str) -> None:
        self.reference = f"ghcr.io/{owner}/{name}"
        self.api = (
            f"/users/{quote(owner, safe='')}/packages/container/{quote(name, safe='')}/versions"
        )
        self.manifests: dict[str, dict[str, Any] | None] = {}

    def versions(self) -> list[PackageVersion]:
        pages = json.loads(output(["gh", "api", "--paginate", "--slurp", self.api]))
        return [PackageVersion.parse(item) for page in pages for item in page]

    def manifest(self, image_digest: str) -> dict[str, Any] | None:
        image_digest = digest(image_digest)
        if image_digest not in self.manifests:
            result = run(
                [
                    "docker",
                    "buildx",
                    "imagetools",
                    "inspect",
                    "--raw",
                    f"{self.reference}@{image_digest}",
                ],
                capture=True,
                check=False,
            )
            if result.returncode:
                if not re.search(
                    r"manifest unknown|name unknown|(?:\S+): not found", result.stderr, re.I
                ):
                    raise RuntimeError(
                        f"Inspecting {self.reference}@{image_digest} failed: {result.stderr.strip()}"
                    )
                self.manifests[image_digest] = None
            else:
                self.manifests[image_digest] = json.loads(result.stdout)
        return self.manifests[image_digest]

    def orphan_tag(self, tag: str) -> bool:
        match = FALLBACK_TAG.fullmatch(tag)
        return bool(match and self.manifest("sha256:" + match[1]) is None)

    def referenced(self, roots: list[str]) -> set[str]:
        kept = set()
        pending = list(roots)
        while pending:
            image_digest = pending.pop()
            if image_digest in kept:
                continue
            kept.add(image_digest)
            manifest = self.manifest(image_digest)
            if manifest:
                pending.extend(digest(item["digest"]) for item in manifest.get("manifests", []))
                if subject := manifest.get("subject"):
                    pending.append(digest(subject["digest"]))
        return kept

    def candidates(self, versions: list[PackageVersion], cutoff: datetime) -> list[PackageVersion]:
        roots = []
        for version in versions:
            if version.updated > cutoff:
                roots.append(version.digest)
            if version.tags and not all(self.orphan_tag(tag) for tag in version.tags):
                if self.manifest(version.digest) is None:
                    raise ValueError(
                        f"Tagged manifest {self.reference}@{version.digest} is missing; cleanup stopped"
                    )
                roots.append(version.digest)
        kept = self.referenced(roots)
        candidates = []
        for version in versions:
            if version.digest in kept or version.updated > cutoff:
                continue
            # OCI referrers may not be listed under a tag. Preserve their subjects/signatures.
            if "subject" not in (self.manifest(version.digest) or {}):
                candidates.append(version)
        return candidates

    def clean(self, minimum_age: timedelta, dry_run: bool) -> None:
        cutoff = datetime.now(UTC) - minimum_age
        # Finish every registry read before deleting anything; a failed read aborts cleanup.
        candidates = self.candidates(self.versions(), cutoff)
        for version in candidates:
            action = "would delete" if dry_run else "deleting"
            print(
                f"{action} {self.reference}@{version.digest}, updated {version.updated.isoformat()}"
            )
            if not dry_run:
                run(["gh", "api", "--method", "DELETE", f"{self.api}/{version.id}"], capture=True)


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument("--min-age-days", type=int, default=14)
    parser.add_argument("--owner", default="hambn")
    parser.add_argument("packages", nargs="+")
    args = parser.parse_args()
    if args.min_age_days < 0:
        parser.error("--min-age-days must be nonnegative")
    for name in args.packages:
        Package(args.owner, name).clean(timedelta(days=args.min_age_days), args.dry_run)
