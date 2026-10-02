"""Bake targets, immutable image references, and layer export policy."""

from __future__ import annotations

import json
import re
from datetime import date
from pathlib import Path
from typing import Any

from ci import output, run

# Changing this value rewrites layer tar headers, even on a build-cache hit.
SOURCE_DATE_EPOCH = "1767225600"  # 2026-01-01 UTC; retain the epoch used by published images.
ARCHITECTURES = {"amd64": "ubuntu-24.04", "arm64": "ubuntu-24.04-arm"}
LABEL_PREFIX = "io.github.hambn.containers."
BASE_DIGEST_LABEL = "org.opencontainers.image.base.digest"
OS_REFRESH_LABEL = LABEL_PREFIX + "os-refresh"
DIGEST_PATTERN = re.compile(r"sha256:[0-9a-f]{64}")
TAG_PATTERN = re.compile(r"[A-Za-z0-9_][A-Za-z0-9_.-]{0,127}")
# Keep gzip and reuse existing blobs. force-compression would change their digests.
LAYER_EXPORT = "rewrite-timestamp=true,compression=gzip,force-compression=false"


def digest(value: str) -> str:
    if not DIGEST_PATTERN.fullmatch(value):
        raise ValueError(f"Invalid image digest: {value!r}")
    return value


def identifier(value: str) -> str:
    if not TAG_PATTERN.fullmatch(value):
        raise ValueError(f"Invalid image tag or target: {value!r}")
    return value


def repository(reference: str) -> str:
    name = reference.split("@", 1)[0]
    # A registry port belongs to the hostname, not the image tag.
    return name.rsplit(":", 1)[0] if ":" in name.rsplit("/", 1)[-1] else name


def pinned(reference: str, image_digest: str) -> str:
    return f"{repository(reference)}@{digest(image_digest)}"


def missing_image(message: str) -> bool:
    # Authentication, rate limits, and network failures are errors, not missing images.
    # GHCR refuses an anonymous token for a repository that was never published.
    return bool(
        re.search(
            r"manifest unknown|name unknown|\S+: not found|anonymous token: .*403 Forbidden",
            message,
            re.I,
        )
    )


def inspect(
    reference: str, field: str = "Manifest", *, missing_ok: bool = False
) -> dict[str, Any] | None:
    result = run(
        [
            "docker",
            "buildx",
            "imagetools",
            "inspect",
            reference,
            "--format",
            f"{{{{json .{field}}}}}",
        ],
        capture=True,
        check=False,
    )
    if result.returncode:
        message = result.stderr.strip()
        if missing_ok and missing_image(message):
            return None
        raise RuntimeError(f"Cannot inspect {reference}: {message}")
    document = json.loads(result.stdout)
    if not isinstance(document, dict):
        raise ValueError(f"{reference}: expected a {field} object")
    return document


def platform_manifests(manifest: dict[str, Any]) -> dict[str, str]:
    platforms = {}
    for child in manifest.get("manifests", []):
        platform = child.get("platform", {})
        arch = platform.get("architecture")
        if platform.get("os") == "linux" and arch in ARCHITECTURES:
            if arch in platforms:
                raise ValueError(f"Duplicate linux/{arch} manifest")
            platforms[arch] = digest(child["digest"])
    return platforms


def bake_targets(tool: Path) -> dict[str, Any]:
    targets = json.loads(output(["docker", "buildx", "bake", "--print"], cwd=tool))["target"]
    if not targets:
        raise ValueError(f"{tool}: no bake targets")
    return targets


def dockerfile_arg(tool: Path, name: str) -> str:
    match = re.search(
        rf"^ARG {re.escape(name)}=(.+)$", (tool / "Dockerfile").read_text(encoding="utf-8"), re.M
    )
    return match[1].strip() if match else ""


def cache_reference(cache: str, image: str, variant: str, arch: str) -> str:
    return f"{cache}:{identifier(image)}-{identifier(variant)}-{arch}"


def cache_imports(
    cache: str, tool: Path, target: str, arch: str, targets: dict[str, Any]
) -> list[str]:
    labels = targets[target]["labels"]
    variant = labels[LABEL_PREFIX + "variant"]
    distro = labels[LABEL_PREFIX + "distro"]
    # Sibling tiers can reuse download/npm stages without competing for one cache tag.
    variants = [variant] + sorted(
        {
            other["labels"][LABEL_PREFIX + "variant"]
            for other in targets.values()
            if other["labels"][LABEL_PREFIX + "distro"] == distro
            and other["labels"][LABEL_PREFIX + "variant"] != variant
        }
    )
    return [
        f"type=registry,ref={cache_reference(cache, tool.name, item, arch)}" for item in variants
    ]


def retained_refresh(default: str, labels: list[dict[str, str]]) -> str:
    if not default:
        return ""
    dates = [default, *((item.get(OS_REFRESH_LABEL) or default) for item in labels)]
    for value in dates:
        if not re.fullmatch(r"\d{4}-\d{2}-\d{2}", value):
            raise ValueError(f"Invalid OS_REFRESH date: {value!r}")
        date.fromisoformat(value)
    # A parent bump must not bring back the vulnerable layer from an older refresh.
    return max(dates)
