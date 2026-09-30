"""Select image variants and pin their parents before the build matrix starts."""

from __future__ import annotations

import json
import os
from dataclasses import asdict, dataclass, field
from datetime import UTC, datetime
from pathlib import Path
from typing import Any

from ci import annotation, boolean, entrypoint, output, required, run, summary, write_actions
from image_common import (
    ARCHITECTURES,
    BASE_DIGEST_LABEL,
    LABEL_PREFIX,
    bake_targets,
    digest,
    dockerfile_arg,
    identifier,
    inspect,
    pinned,
    platform_manifests,
    retained_refresh,
)


@dataclass
class Variant:
    target: str
    variant: str
    base: str
    distro: str
    tier: str
    os_refresh: str = ""
    parents: list[dict[str, str]] = field(default_factory=list)


class Planner:
    def __init__(self, root: Path, ghcr: str) -> None:
        self.root = root
        self.ghcr = ghcr
        self.manifests: dict[str, dict[str, Any] | None] = {}
        self.targets: dict[Path, dict[str, Any]] = {}

    def manifest(self, reference: str) -> dict[str, Any] | None:
        if reference not in self.manifests:
            self.manifests[reference] = inspect(reference, missing_ok=True)
        return self.manifests[reference]

    def bake(self, tool: Path) -> dict[str, Any]:
        if tool not in self.targets:
            self.targets[tool] = bake_targets(self.root / tool)
        return self.targets[tool]

    def parents(self, base: str) -> tuple[str, list[dict[str, str]]]:
        chain = []
        seen = set()
        while base.startswith(self.ghcr + "/"):
            if base in seen:
                raise ValueError(f"Parent cycle at {base}")
            seen.add(base)
            manifest = self.manifest(base)
            if manifest and set(platform_manifests(manifest)) == set(ARCHITECTURES):
                immutable = pinned(base, manifest["digest"])
                if chain:
                    chain[0]["base"] = immutable
                    return "", chain
                return immutable, []
            name, separator, tag = base.removeprefix(self.ghcr + "/").partition(":")
            if not separator or "@" in tag:
                raise ValueError(f"Cannot locate source for unpublished parent {base}")
            tools = sorted((self.root / "tools").glob(f"*/{identifier(name)}"))
            if len(tools) != 1:
                raise ValueError(f"Expected one source directory for {base}, found {len(tools)}")
            tool = tools[0].relative_to(self.root)
            matches = [
                key
                for key, value in self.bake(tool).items()
                if value["labels"][LABEL_PREFIX + "variant"] == tag
            ]
            if len(matches) != 1:
                raise ValueError(f"Expected one bake target for {base}")
            target = matches[0]
            chain.insert(0, {"dir": tool.as_posix(), "target": target, "base": ""})
            base = self.bake(tool)[target].get("args", {}).get("BASE_IMAGE", "")
        return "", chain

    def published_labels(self, reference: str, manifest: dict[str, Any]) -> list[dict[str, str]]:
        labels = []
        for arch_digest in platform_manifests(manifest).values():
            image = inspect(pinned(reference, arch_digest), "Image")
            labels.append(image.get("config", {}).get("Labels", {}))
        return labels


def fixable_os_vulnerabilities(reference: str, arch: str, root: Path) -> bool:
    result = run(
        [
            "trivy",
            "image",
            "--quiet",
            "--image-src",
            "remote",
            "--platform",
            f"linux/{arch}",
            "--pkg-types",
            "os",
            "--scanners",
            "vuln",
            "--severity",
            "HIGH,CRITICAL",
            "--ignore-unfixed",
            "--ignorefile",
            root / "tools/trivyignore.yaml",
            "--exit-code",
            "2",
            reference,
        ],
        check=False,
    )
    if result.returncode not in {0, 2}:
        raise RuntimeError(f"Trivy failed for {reference} on {arch}, exit {result.returncode}")
    return result.returncode == 2


def select_variants(planner: Planner, tool: Path, outdated_only: bool) -> list[Variant]:
    selected = []
    default_refresh = dockerfile_arg(planner.root / tool, "OS_REFRESH")
    for target, settings in sorted(planner.bake(tool).items()):
        labels = settings["labels"]
        variant = identifier(labels[LABEL_PREFIX + "variant"])
        base, parents = planner.parents(settings.get("args", {}).get("BASE_IMAGE", ""))
        if parents and outdated_only:
            print(f"{variant}: waiting for its parent workflow")
            continue
        published = f"{planner.ghcr}/{tool.name}:{variant}"
        manifest = planner.manifest(published)
        current_labels = planner.published_labels(published, manifest) if manifest else []
        refresh = retained_refresh(default_refresh, current_labels)
        if outdated_only:
            if not manifest or set(platform_manifests(manifest)) != set(ARCHITECTURES):
                print(f"{variant}: not published for both architectures")
            elif base and any(
                item.get(BASE_DIGEST_LABEL) != base.split("@", 1)[1] for item in current_labels
            ):
                print(f"{variant}: parent changed")
            else:
                immutable = pinned(published, digest(manifest["digest"]))
                # Scan both architectures; a clean amd64 image says nothing about arm64 packages.
                vulnerable = [
                    fixable_os_vulnerabilities(immutable, arch, planner.root)
                    for arch in ARCHITECTURES
                ]
                if not any(vulnerable):
                    print(f"{variant}: current")
                    continue
                annotation(
                    "warning", f"{variant}: refreshing fixable HIGH/CRITICAL OS vulnerabilities"
                )
                refresh = max(refresh, datetime.now(UTC).date().isoformat())
        if parents:
            annotation("notice", f"{variant}: building unpublished parents from source")
        selected.append(
            Variant(
                target,
                variant,
                base,
                labels[LABEL_PREFIX + "distro"],
                labels[LABEL_PREFIX + "tier"],
                refresh,
                parents,
            )
        )
    return selected


def main() -> None:
    root = Path(required("GITHUB_WORKSPACE"))
    tool = Path(required("TOOL"))
    planner = Planner(root, required("GHCR"))
    version_arg = os.environ.get("VERSION_ARG", "")
    version = (
        dockerfile_arg(root / tool, version_arg)
        if version_arg
        else (
            output(["git", "log", "-1", "--format=%cd", "--date=format:%Y%m%d"], cwd=root)
            + "-"
            + output(["git", "rev-parse", "--short=7", "HEAD"], cwd=root)
        )
    )
    if not version:
        raise ValueError(f"{tool}/Dockerfile has no ARG {version_arg}=<version>")
    variants = [asdict(item) for item in select_variants(planner, tool, boolean("OUTDATED_ONLY"))]
    builds = [
        {**item, "arch": arch, "runner": runner}
        for item in variants
        for arch, runner in ARCHITECTURES.items()
    ]
    publish = (
        os.environ.get("GITHUB_REF") == "refs/heads/main"
        and os.environ.get("GITHUB_EVENT_NAME") != "pull_request"
    )
    write_actions(
        "GITHUB_OUTPUT",
        {
            "image": tool.name,
            "version": version,
            "variants": json.dumps(variants, separators=(",", ":")),
            "builds": json.dumps(builds, separators=(",", ":")),
            "publish": str(publish).lower(),
        },
    )
    rows = [
        f"- `{item['variant']}` on `{item['base'] or 'source parents / Dockerfile pins'}`"
        for item in variants
    ]
    summary(f"### {tool.name} {version}\n\n" + ("\n".join(rows) or "Nothing to build."))


if __name__ == "__main__":
    entrypoint(main)
