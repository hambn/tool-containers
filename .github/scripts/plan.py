#!/usr/bin/env python3
"""Plan which published bake targets to build, grouped into one matrix job per tool.

A target is affected when a file in its build context changes (README.md and
examples/ excepted), when its printed bake definition changes, or when a target it
consumes through a `target:` context is affected. Changes to the image pipeline
itself affect every target.
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
    ".github/scripts/plan.py",
    ".github/scripts/bake-env.sh",
    ".github/scripts/build-tool.sh",
    ".github/scripts/publish.sh",
    ".trivyignore.yaml",
}
IGNORED_KEYS = {"tags", "cache-from", "cache-to", "output", "platforms"}
IGNORED_LABELS = {
    "org.opencontainers.image.revision",
    "org.opencontainers.image.created",
    "org.opencontainers.image.version",
}
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


def plan(head: dict, base: dict | None, changed: list[str], event: str, requested: list[str]) -> dict:
    published = expand(head, ["all"])
    if event == "workflow_dispatch":
        selected = set(expand(head, requested))
        internal = sorted(selected - set(published))
        if internal:
            raise ValueError(f"not published targets: {internal}")
    else:
        selected = affected_targets(head, base, changed) & set(published)
    return {"targets": [name for name in published if name in selected]}


def tool_jobs(bake: dict, targets: list[str]) -> list[dict]:
    """Group selected variants by their tool context, without adding other variants."""
    jobs: dict[str, dict] = {}
    for target in targets:
        context = pathlib.PurePosixPath(bake["target"][target]["context"])
        if len(context.parts) != 3 or context.parts[0] != "tools" or ".." in context.parts:
            raise ValueError(f"expected tools/<category>/<tool> context for {target}: {context}")
        name = "/".join(context.parts[1:])
        if name not in jobs:
            jobs[name] = {"name": name, "artifact": "-".join(context.parts[1:]), "targets": []}
        jobs[name]["targets"].append(target)
    return list(jobs.values())


def bake_print(directory: pathlib.Path, cwd: pathlib.Path) -> dict:
    files = [argument for name in BAKE_FILES for argument in ("-f", str(directory / name))]
    result = subprocess.run(
        ["docker", "buildx", "bake", *files, "--print", "all"],
        cwd=cwd, check=True, capture_output=True, text=True,
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

    outputs = {
        "targets": json.dumps(result["targets"]),
        "tools": json.dumps(tool_jobs(head, result["targets"])),
    }
    if args.dry_run or "GITHUB_OUTPUT" not in os.environ:
        print(json.dumps(outputs, indent=2))
    else:
        with open(os.environ["GITHUB_OUTPUT"], "a", encoding="utf-8") as handle:
            handle.writelines(f"{key}={value}\n" for key, value in outputs.items())
    print(f"changed files: {len(changed)}; targets: {result['targets']}", file=sys.stderr)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
