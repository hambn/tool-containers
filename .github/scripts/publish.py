"""Publish complete architecture pairs and sign each resulting registry index."""

from __future__ import annotations

import json
import os
from pathlib import Path

from ci import annotation, entrypoint, required, run, summary
from image_common import ARCHITECTURES, digest, identifier, inspect, pinned, platform_manifests


def tags(variant: str, version: str, latest_variant: str, version_prefix: str) -> list[str]:
    names = [identifier(variant)]
    if variant == latest_variant:
        names.append("latest")
        if version_prefix:
            names.append(identifier(f"{version_prefix}-{version}"))
    return list(dict.fromkeys(names))


def publication_sources(directory: Path, reference: str, variant: str) -> list[str]:
    sources = []
    for arch in ARCHITECTURES:
        path = directory / f"{identifier(variant)}-{arch}"
        if not path.is_file() or not path.read_text(encoding="utf-8").strip():
            raise ValueError(f"{variant}: missing {arch} build; not published")
        sources.append(pinned(reference, path.read_text(encoding="utf-8").strip()))
    return sources


def validate_sources(sources: list[str]) -> None:
    for arch, source in zip(ARCHITECTURES, sources, strict=True):
        manifest = inspect(source)
        platforms = platform_manifests(manifest)
        if platforms:
            if set(platforms) != {arch}:
                raise ValueError(f"{source}: expected only linux/{arch}, got {sorted(platforms)}")
        else:
            image = inspect(source, "Image")
            if image.get("os") != "linux" or image.get("architecture") != arch:
                raise ValueError(f"{source}: expected linux/{arch}")


def main() -> int:
    if (
        os.environ.get("GITHUB_REF") != "refs/heads/main"
        or os.environ.get("GITHUB_EVENT_NAME") == "pull_request"
    ):
        raise ValueError("Registry tags may only be published from main outside pull requests")
    image = identifier(required("IMAGE"))
    reference = f"{required('REPO')}/{image}"
    source = f"{required('GHCR')}/{image}"
    variants = json.loads(required("VARIANTS"))
    directory = Path(required("RUNNER_TEMP")) / "digests"
    latest = identifier(required("LATEST_VARIANT"))
    if latest not in {item["variant"] for item in variants}:
        # Outdated-only runs may legitimately omit the variant that owns latest.
        print(f"{latest} is unchanged; its latest/version tags stay in place")
    failures = []
    rows = []
    for item in variants:
        variant = item["variant"]
        try:
            sources = publication_sources(directory, source, variant)
            validate_sources(sources)
            names = tags(variant, required("VERSION"), latest, os.environ.get("VERSION_PREFIX", ""))
            run(
                [
                    "docker",
                    "buildx",
                    "imagetools",
                    "create",
                    *(f"--tag={reference}:{name}" for name in names),
                    *sources,
                ]
            )
            manifest = inspect(f"{reference}:{names[0]}")
            if set(platform_manifests(manifest)) != set(ARCHITECTURES):
                raise ValueError(f"{variant}: published index is missing an architecture")
            image_digest = digest(manifest["digest"])
            run(["cosign", "sign", "--yes", pinned(reference, image_digest)])
            rows.append(f"- `{reference}:{', '.join(names)}` → `{image_digest}`")
        except (OSError, RuntimeError, ValueError) as exc:
            annotation("error", str(exc))
            failures.append(variant)
    summary(
        f"### Published to {required('REPO')}\n\n"
        + "\n".join(rows)
        + (f"\n\nFailed variants: {', '.join(failures)}" if failures else "")
    )
    return int(bool(failures))


if __name__ == "__main__":
    entrypoint(main)
