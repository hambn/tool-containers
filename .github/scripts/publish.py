"""Publish complete architecture pairs and sign each resulting registry index."""

from __future__ import annotations

import json
import os
import re
from pathlib import Path

from ci import annotation, entrypoint, required, run, summary
from image_common import (
    ARCHITECTURES,
    LABEL_PREFIX,
    bake_targets,
    digest,
    identifier,
    inspect,
    pinned,
    platform_manifests,
)


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
        manifest = inspect(source, retry_rate_limit=True)
        platforms = platform_manifests(manifest)
        if platforms:
            if set(platforms) != {arch}:
                raise ValueError(f"{source}: expected only linux/{arch}, got {sorted(platforms)}")
        else:
            image = inspect(source, "Image", retry_rate_limit=True)
            if image.get("os") != "linux" or image.get("architecture") != arch:
                raise ValueError(f"{source}: expected linux/{arch}")


def verify_signature(reference: str, *, missing_ok: bool = False) -> bool:
    # Accept only this repository's main-branch workflows, including the reusable one.
    identity = (
        "^"
        + re.escape(f"https://github.com/{required('GITHUB_REPOSITORY')}/.github/workflows/")
        + r"[^/]+\.yml@refs/heads/main$"
    )
    result = run(
        [
            "cosign",
            "verify",
            "--certificate-identity-regexp=" + identity,
            "--certificate-oidc-issuer=https://token.actions.githubusercontent.com",
            reference,
        ],
        capture=True,
        check=False,
        retry_rate_limit=True,
    )
    if result.returncode:
        message = (result.stderr or result.stdout or "").strip()
        if (
            missing_ok
            and re.search(r"no signatures found|no matching signatures", message, re.I)
            and not re.search(
                r"\b(?:401|403|429|5\d\d)\b|unauthorized|forbidden|timed out|timeout|connection",
                message,
                re.I,
            )
        ):
            return False
        raise RuntimeError(f"Cannot verify {reference}: {message}")
    return True


def recover_variant(source: str, reference: str, variant: str, latest: str, prefix: str) -> str:
    manifest = inspect(f"{source}:{variant}", missing_ok=True, retry_rate_limit=True)
    if manifest is None:
        return f"- `{variant}` has no GHCR release to recover."
    platforms = platform_manifests(manifest)
    if set(platforms) != set(ARCHITECTURES):
        raise ValueError(f"{variant}: GHCR release is missing an architecture")
    image_digest = digest(manifest["digest"])
    immutable = pinned(source, image_digest)
    versions = set()
    for arch_digest in platforms.values():
        image = inspect(pinned(source, arch_digest), "Image", retry_rate_limit=True)
        labels = image.get("config", {}).get("Labels", {})
        if labels.get(LABEL_PREFIX + "variant") != variant:
            raise ValueError(f"{variant}: GHCR release has inconsistent variant labels")
        versions.add(labels.get("org.opencontainers.image.version", ""))
    if len(versions) != 1 or not next(iter(versions)):
        raise ValueError(f"{variant}: GHCR release has inconsistent or missing versions")
    # Recovery tags describe the published release, not today's Dockerfile version.
    names = tags(variant, versions.pop(), latest, prefix)
    current = True
    for name in names:
        destination = inspect(f"{reference}:{name}", missing_ok=True, retry_rate_limit=True)
        if destination is None or digest(destination["digest"]) != image_digest:
            current = False
    if current and verify_signature(pinned(reference, image_digest), missing_ok=True):
        return f"- `{reference}:{variant}` is current and signed."
    # Only recover a previously signed release, never an untested digest export.
    verify_signature(immutable)
    if not current:
        run(
            [
                "docker",
                "buildx",
                "imagetools",
                "create",
                *(f"--tag={reference}:{name}" for name in names),
                immutable,
            ],
            retry_rate_limit=True,
        )
        for name in names:
            destination = inspect(f"{reference}:{name}", retry_rate_limit=True)
            if digest(destination["digest"]) != image_digest or set(
                platform_manifests(destination)
            ) != set(ARCHITECTURES):
                raise ValueError(f"{variant}: recovered tag {name} does not match GHCR")
    run(["cosign", "sign", "--yes", pinned(reference, image_digest)], retry_rate_limit=True)
    return f"- Recovered `{reference}:{', '.join(names)}` → `{image_digest}`"


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
                ],
                retry_rate_limit=True,
            )
            manifest = inspect(f"{reference}:{names[0]}", retry_rate_limit=True)
            if set(platform_manifests(manifest)) != set(ARCHITECTURES):
                raise ValueError(f"{variant}: published index is missing an architecture")
            image_digest = digest(manifest["digest"])
            run(["cosign", "sign", "--yes", pinned(reference, image_digest)], retry_rate_limit=True)
            rows.append(f"- `{reference}:{', '.join(names)}` → `{image_digest}`")
        except (OSError, RuntimeError, ValueError) as exc:
            annotation("error", str(exc))
            failures.append(variant)
    if os.environ.get("RECOVER") == "true":
        if not reference.startswith("docker.io/"):
            raise ValueError("Publication recovery is only supported for Docker Hub")
        selected = {item["variant"] for item in variants}
        available = {
            identifier(settings["labels"][LABEL_PREFIX + "variant"])
            for settings in bake_targets(Path(required("TOOL"))).values()
        }
        for variant in sorted(available - selected):
            try:
                rows.append(
                    recover_variant(
                        source, reference, variant, latest, os.environ.get("VERSION_PREFIX", "")
                    )
                )
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
