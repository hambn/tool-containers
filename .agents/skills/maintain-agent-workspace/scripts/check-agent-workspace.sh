#!/usr/bin/env bash

set -euo pipefail

script_directory="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
repository_root="$(git -C "$script_directory" rev-parse --show-toplevel 2>/dev/null)" || {
  echo "error: run this command inside a Git repository" >&2
  exit 2
}

cd "$repository_root"

command -v python3 >/dev/null || {
  echo "error: python3 is required for agent workspace validation" >&2
  exit 1
}

python3 - <<'PY'
from __future__ import annotations

import os
import pathlib
import re
import sys

try:
    import yaml
except ImportError:
    print("error: PyYAML is required for agent workspace validation", file=sys.stderr)
    raise SystemExit(1)

root = pathlib.Path.cwd()
agents = root / ".agents"
skills_root = agents / "skills"
errors: list[str] = []

for required in (root / "AGENTS.md", root / "CLAUDE.md", skills_root):
    if not required.exists():
        errors.append(f"missing required path: {required.relative_to(root)}")

if agents.is_dir():
    unexpected = sorted(path.name for path in agents.iterdir() if path.name != "skills")
    if unexpected:
        errors.append(".agents may contain only skills/: " + ", ".join(unexpected))
    legacy_memory = sorted(path.relative_to(root) for path in agents.rglob("memory.md"))
    for path in legacy_memory:
        errors.append(f"legacy memory file is not allowed: {path}")

if not skills_root.is_dir():
    for error in errors:
        print(f"error: {error}", file=sys.stderr)
    raise SystemExit(1)

skill_dirs = sorted(path for path in skills_root.iterdir() if path.is_dir())
loose_entries = sorted(path.name for path in skills_root.iterdir() if not path.is_dir())
if loose_entries:
    errors.append(".agents/skills may contain only skill directories: " + ", ".join(loose_entries))
if not skill_dirs:
    errors.append("no repository skills found")

agents_text = (root / "AGENTS.md").read_text() if (root / "AGENTS.md").is_file() else ""
claude_text = (root / "CLAUDE.md").read_text() if (root / "CLAUDE.md").is_file() else ""
claude_pointer = re.compile(
    r"(?m)^Follow \[`AGENTS\.md`\]\(\./AGENTS\.md\)(?:[.,]|$)"
)
if not claude_pointer.search(claude_text):
    errors.append("CLAUDE.md must positively route to ./AGENTS.md with a Markdown link")

ignored_directories = {
    ".git",
    ".tmp",
    ".codex",
    ".claude",
    "node_modules",
    "dist",
    "build",
    "coverage",
    ".venv",
}
instruction_entrypoints = []
for current_directory, directories, filenames in os.walk(root):
    directories[:] = [name for name in directories if name not in ignored_directories]
    for entrypoint_name in ("AGENTS.md", "CLAUDE.md"):
        if entrypoint_name in filenames:
            path = pathlib.Path(current_directory, entrypoint_name)
            instruction_entrypoints.append(path.relative_to(root))
unexpected_entrypoints = sorted(
    path
    for path in instruction_entrypoints
    if path not in {pathlib.Path("AGENTS.md"), pathlib.Path("CLAUDE.md")}
)
for path in unexpected_entrypoints:
    errors.append(f"project agent entrypoint must be represented as a skill: {path}")

name_pattern = re.compile(r"[a-z0-9]+(?:-[a-z0-9]+)*\Z")
link_pattern = re.compile(r"!?\[[^\]]*\]\(([^)]+)\)")
seen_names: set[str] = set()
seen_descriptions: set[str] = set()

def local_targets(markdown: pathlib.Path):
    for raw_target in link_pattern.findall(markdown.read_text()):
        target = raw_target.strip().strip("<>").split("#", 1)[0]
        if not target or re.match(r"^[a-z][a-z0-9+.-]*:", target):
            continue
        yield (markdown.parent / target).resolve(), target

for skill_dir in skill_dirs:
    entrypoint = skill_dir / "SKILL.md"
    if not entrypoint.is_file():
        errors.append(f"{skill_dir.relative_to(root)}: missing SKILL.md")
        continue

    text = entrypoint.read_text()
    match = re.match(r"\A---\s*\n(.*?)\n---\s*\n", text, re.DOTALL)
    if not match:
        errors.append(f"{entrypoint.relative_to(root)}: invalid YAML frontmatter")
        continue

    frontmatter = match.group(1)
    try:
        metadata = yaml.safe_load(frontmatter)
    except yaml.YAMLError as error:
        errors.append(f"{entrypoint.relative_to(root)}: malformed YAML: {error}")
        continue
    if not isinstance(metadata, dict):
        errors.append(f"{entrypoint.relative_to(root)}: frontmatter must be a mapping")
        continue

    name = metadata.get("name")
    description = metadata.get("description")
    if not isinstance(name, str) or not name_pattern.fullmatch(name) or len(name) > 64:
        errors.append(f"{entrypoint.relative_to(root)}: invalid skill name")
    elif name != skill_dir.name:
        errors.append(f"{entrypoint.relative_to(root)}: name must match its directory")
    elif name in seen_names:
        errors.append(f"{entrypoint.relative_to(root)}: duplicate skill name {name}")
    else:
        seen_names.add(name)

    if not isinstance(description, str) or not description.strip() or len(description) > 500:
        errors.append(f"{entrypoint.relative_to(root)}: description must contain 1-500 characters")
    elif description.casefold() in seen_descriptions:
        errors.append(f"{entrypoint.relative_to(root)}: description duplicates another skill")
    else:
        seen_descriptions.add(description.casefold())

    skill_root = skill_dir.resolve()
    visited: set[pathlib.Path] = set()
    queue = [entrypoint.resolve()]
    while queue:
        current = queue.pop()
        if current in visited or not current.is_file():
            continue
        visited.add(current)
        if current.suffix.lower() != ".md":
            continue
        for target_path, target_text in local_targets(current):
            try:
                target_path.relative_to(root)
            except ValueError:
                errors.append(f"{current.relative_to(root)}: link escapes repository: {target_text}")
                continue
            if not target_path.exists():
                errors.append(f"{current.relative_to(root)}: missing local link {target_text}")
                continue
            try:
                target_path.relative_to(skill_root)
            except ValueError:
                continue
            if target_path.is_file():
                queue.append(target_path)

    supporting = {
        path.resolve()
        for directory in (skill_dir / "references", skill_dir / "scripts")
        if directory.is_dir()
        for path in directory.rglob("*")
        if path.is_file()
    }
    unreachable = sorted(path.relative_to(root) for path in supporting - visited)
    for path in unreachable:
        errors.append(f"{path}: supporting resource is not linked from SKILL.md")

routed_names = set(re.findall(r"\$([a-z0-9]+(?:-[a-z0-9]+)*)", agents_text))
mandatory_routes = {"repository-changes", "maintain-agent-workspace"}
for name in sorted(mandatory_routes - routed_names):
    errors.append(f"AGENTS.md must route mandatory skill ${name}")
for name in sorted(routed_names - seen_names):
    errors.append(f"AGENTS.md routes missing skill ${name}")

if errors:
    for error in errors:
        print(f"error: {error}", file=sys.stderr)
    raise SystemExit(1)
PY

while IFS= read -r -d '' script; do
  bash -n "$script"
  [[ -x "$script" ]] || {
    echo "error: skill script is not executable: $script" >&2
    exit 1
  }
done < <(find .agents/skills -path '*/scripts/*' -type f -name '*.sh' -print0)

echo "Agent workspace checks passed."
