#!/usr/bin/env python3
"""Plan which published bake targets to build, grouped into dependency waves.

A target is affected when a file in its build context changes (README.md and
examples/ excepted), when its printed bake definition changes, or when a target it
consumes through a `target:` context is affected. Changes to the image pipeline
itself affect every target.

Waves follow cache-sharing edges: an internal target (never tagged) that reads a
published target's registry cache must wait for that target so the cache is warm.
A direct `target:` context on a published target is built inside the same bake
invocation and does not add a wave, so core and devbox share the first wave.
"""

from __future__ import annotations

import argparse
import json
import os
import pathlib
import subprocess
import sys
import tempfile

BAKE_FILES = ("docker-bake.hcl", "versions.hcl")
PIPELINE_FILES = {
    ".github/workflows/images.yml",
    ".github/workflows/image-build.yml",
    ".github/scripts/plan.py",
    ".github/scripts/bake-env.sh",
    ".trivyignore.yaml",
}
IGNORED_KEYS = {"tags", "cache-from", "cache-to", "output", "platforms"}
IGNORED_LABELS = {
    "org.opencontainers.image.revision",
    "org.opencontainers.image.created",
    "org.opencontainers.image.version",
}
MAX_WAVES = 3
ZERO_SHA = "0" * 40


def expand(bake: dict, names: list[str]) -> list[str]:
    """Expand group and target names to target names, preserving first-seen order."""
    result: list[str] = []
    for name in names:
        if name in bake.get("group", {}):
            members = expand(bake, bake["group"][name]["targets"])
        elif name in bake.get("target", {}):
            members = [name]
        else:
            raise ValueError(f"unknown bake target or group: {name}")
        result.extend(member for member in members if member not in result)
    return result


def dependencies(definition: dict) -> list[str]:
    return [
        value.removeprefix("target:")
        for value in (definition.get("contexts") or {}).values()
        if value.startswith("target:")
    ]


def normalized(definition: dict) -> dict:
    result = {key: value for key, value in definition.items() if key not in IGNORED_KEYS}
    result["labels"] = {
        key: value
        for key, value in (definition.get("labels") or {}).items()
        if key not in IGNORED_LABELS
    }
    return result


def context_changed(context: str, changed: list[str]) -> bool:
    prefix = context.rstrip("/") + "/"
    for path in changed:
        if not path.startswith(prefix):
            continue
        relative = path[len(prefix) :]
        if pathlib.PurePosixPath(relative).name == "README.md" or relative.startswith("examples/"):
            continue
        return True
    return False


def affected_targets(head: dict, base: dict | None, changed: list[str]) -> set[str]:
    """Return every target (published or internal) affected by the change."""
    targets = head["target"]
    if base is None or PIPELINE_FILES.intersection(changed):
        return set(targets)
    base_targets = base.get("target", {})
    direct = {
        name
        for name, definition in targets.items()
        if context_changed(definition.get("context", "."), changed)
        or name not in base_targets
        or normalized(definition) != normalized(base_targets[name])
    }
    memo: dict[str, bool] = {}

    def visit(name: str) -> bool:
        if name not in memo:
            memo[name] = False
            memo[name] = name in direct or any(visit(dep) for dep in dependencies(targets[name]))
        return memo[name]

    return {name for name in targets if visit(name)}


def depths(bake: dict, published: list[str]) -> dict[str, int]:
    """Wave index per published target, following cache-sharing edges only."""
    targets = bake["target"]
    published_set = set(published)
    cache_owner = {
        entry["ref"]: name
        for name in published
        for entry in targets[name].get("cache-to") or []
    }

    def owner(name: str) -> str | None:
        for entry in targets[name].get("cache-from") or []:
            if cache_owner.get(entry["ref"], name) != name:
                return cache_owner[entry["ref"]]
        return None

    memo: dict[str, int] = {}

    def depth(name: str) -> int:
        if name in memo:
            return memo[name]
        memo[name] = 0
        result = 0
        for dep in dependencies(targets[name]):
            if dep in published_set:
                continue
            dep_owner = owner(dep)
            result = max(result, depth(dep_owner) + 1 if dep_owner else depth(dep))
        memo[name] = result
        return result

    return {name: depth(name) for name in published}


def plan(head: dict, base: dict | None, changed: list[str], event: str, requested: list[str]) -> dict:
    published = expand(head, ["all"])
    if event == "workflow_dispatch":
        selected = set(expand(head, requested))
        internal = sorted(selected - set(published))
        if internal:
            raise ValueError(f"not published targets: {internal}")
    else:
        selected = affected_targets(head, base, changed) & set(published)
    wave_of = depths(head, published)
    count = max(wave_of.values(), default=0) + 1
    if count > MAX_WAVES:
        raise ValueError(f"{count} waves exceed the {MAX_WAVES} build jobs in images.yml")
    waves = [[name for name in published if name in selected and wave_of[name] == index] for index in range(MAX_WAVES)]
    return {"waves": waves, "targets": [name for wave in waves for name in wave]}


def bake_print(directory: pathlib.Path, cwd: pathlib.Path) -> dict:
    files = [argument for name in BAKE_FILES for argument in ("-f", str(directory / name))]
    # Cache refs identify which internal targets reuse a published target's cache.
    env = {**os.environ, "CACHE_REF": "plan", "CACHE_WRITE": "true"}
    result = subprocess.run(
        ["docker", "buildx", "bake", *files, "--print", "all"],
        cwd=cwd, env=env, check=True, capture_output=True, text=True,
    )
    return json.loads(result.stdout)


def git(*args: str) -> str:
    return subprocess.run(["git", *args], check=True, capture_output=True, text=True).stdout


def base_definition(base: str, root: pathlib.Path) -> dict | None:
    with tempfile.TemporaryDirectory() as temporary:
        directory = pathlib.Path(temporary)
        for name in BAKE_FILES:
            result = subprocess.run(["git", "show", f"{base}:{name}"], capture_output=True, text=True)
            if result.returncode:
                return None
            (directory / name).write_text(result.stdout)
        try:
            return bake_print(directory, root)
        except subprocess.CalledProcessError:
            return None


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("--event", default=os.environ.get("EVENT_NAME", "workflow_dispatch"))
    parser.add_argument("--base", default=os.environ.get("BASE_SHA", ""))
    parser.add_argument("--head", default=os.environ.get("HEAD_SHA", "HEAD"))
    parser.add_argument("--targets", default=os.environ.get("DISPATCH_TARGETS", "all"))
    parser.add_argument("--dry-run", action="store_true", help="print JSON instead of writing GITHUB_OUTPUT")
    args = parser.parse_args()

    root = pathlib.Path(git("rev-parse", "--show-toplevel").strip())
    os.chdir(root)
    head = bake_print(root, root)
    base = None
    changed: list[str] = []
    if args.event != "workflow_dispatch" and args.base and args.base != ZERO_SHA:
        changed = git("diff", "--name-only", args.base, args.head).split()
        base = base_definition(args.base, root)
    result = plan(head, base, changed, args.event, args.targets.split() or ["all"])

    outputs = {"waves": json.dumps(result["waves"]), "targets": json.dumps(result["targets"])}
    for index, wave in enumerate(result["waves"], start=1):
        outputs[f"wave_{index}"] = json.dumps(wave)
        outputs[f"has_wave_{index}"] = json.dumps(bool(wave))
    if args.dry_run or "GITHUB_OUTPUT" not in os.environ:
        print(json.dumps(outputs, indent=2))
    else:
        with open(os.environ["GITHUB_OUTPUT"], "a", encoding="utf-8") as handle:
            handle.writelines(f"{key}={value}\n" for key, value in outputs.items())
    print(f"changed files: {len(changed)}; targets: {result['targets']}", file=sys.stderr)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
