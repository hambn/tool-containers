#!/usr/bin/env bash
set -euo pipefail

root=$(git rev-parse --show-toplevel)
cd "$root"

command -v python3 >/dev/null
python3 - <<'PY'
import pathlib
import re
import subprocess
import sys

try:
    import yaml
except ImportError:
    print("PyYAML is required for workflow validation", file=sys.stderr)
    raise SystemExit(1)

workflows = sorted(pathlib.Path(".github/workflows").glob("*.yml"))
publish = [p for p in workflows if p.name != "validate-repository.yml"]
if len(publish) != 8:
    raise SystemExit(f"expected eight publish workflows, found {len(publish)}")

for path in workflows:
    document = yaml.safe_load(path.read_text())
    text = path.read_text()
    for job in (document or {}).get("jobs", {}).values():
        for step in job.get("steps", []) if isinstance(job, dict) else []:
            run = step.get("run") if isinstance(step, dict) else None
            if run:
                result = subprocess.run(["bash", "-n"], input=run, text=True, capture_output=True)
                if result.returncode:
                    raise SystemExit(f"{path}: embedded shell syntax error: {result.stderr.strip()}")
    if path in publish:
        required = {
            "concurrency:": "concurrency",
            "cancel-in-progress: false": "non-canceling concurrency",
            "timeout-minutes:": "job timeout",
            "fetch-depth: 0": "full-history checkout",
            "provenance: true": "provenance",
            "sbom: true": "SBOM",
            "severity: HIGH,CRITICAL": "Trivy severity",
            'exit-code: "1"': "Trivy gate",
            "scope=${{ env.IMAGE }}-${{ matrix.variant }}": "unique cache scope",
            "github.ref == 'refs/heads/main'": "main-only dispatch",
            '".github/scripts/**"': "shared-helper push trigger",
        }
        for needle, label in required.items():
            if needle not in text:
                raise SystemExit(f"{path}: missing {label}")
        if "continue-on-error: true" in text:
            raise SystemExit(f"{path}: publishing must fail closed on scan errors")
        if "2>/dev/null || true" in text:
            raise SystemExit(f"{path}: suppressed planning error")
    for line in text.splitlines():
        match = re.search(r"\buses:\s*([^#\s]+)", line)
        if not match or match.group(1).startswith("./"):
            continue
        if not re.fullmatch(r"[^@]+@[0-9a-f]{40}", match.group(1)):
            raise SystemExit(f"{path}: action must use a full commit SHA: {line}")

for path in pathlib.Path("ai").glob("*/images/*/Dockerfile"):
    text = path.read_text()
    if "ARG BASE_IMAGE" not in text or "FROM ${BASE_IMAGE}" not in text:
        raise SystemExit(f"{path}: derived image must use global BASE_IMAGE")

for path in pathlib.Path("base/agentimg/images").glob("*/Dockerfile"):
    text = path.read_text()
    if "ARG RUNTIME_BASE" not in text or "FROM ${RUNTIME_BASE}" not in text:
        raise SystemExit(f"{path}: missing global RUNTIME_BASE contract")
    from_count = sum(1 for line in text.splitlines() if line.strip().upper().startswith("FROM "))
    if from_count > 1 and "ARG BROWSER_BASE" not in text:
        raise SystemExit(f"{path}: missing global BROWSER_BASE contract")
PY

while IFS= read -r -d '' file; do
    bash -n "$file"
done < <(find .github/scripts -type f -name '*.sh' -print0)

while IFS= read -r -d '' file; do
    mode=$(stat -c '%A' "$file")
    [[ "$mode" == -*x* ]] || { echo "not executable: $file" >&2; exit 1; }
done < <(find .github/scripts -type f -name '*.sh' -print0)

python3 - <<'PY'
import pathlib, re, sys

for path in pathlib.Path(".").rglob("*.md"):
    if any(part in {".git", ".codex", ".claude"} for part in path.parts):
        continue
    for target in re.findall(r"\[[^]]+\]\(([^)]+)\)", path.read_text()):
        if target.startswith(("http://", "https://", "#", "mailto:")) or "<" in target:
            continue
        target = target.split("#", 1)[0]
        if target and not (path.parent / target).exists():
            raise SystemExit(f"{path}: missing local link {target}")
PY

export WORKSPACE="$root" OPENAI_API_KEY=validation ANTHROPIC_API_KEY=validation
if command -v docker >/dev/null && docker compose version >/dev/null 2>&1; then
    while IFS= read -r -d '' file; do
        docker compose -f "$file" config --quiet
    done < <(find . -type f \( -name '*compose*.yml' -o -name '*compose*.yaml' \) -print0)
else
    echo "Docker Compose unavailable; skipped render (no build/pull performed)"
fi

if command -v helm >/dev/null; then
    while IFS= read -r -d '' chart; do
        helm lint "$chart" >/dev/null
        helm template validation "$chart" >/dev/null
    done < <(find . -type f -name Chart.yaml -printf '%h\0')
else
    echo "Helm unavailable; skipped lint/template"
fi

echo "Static repository validation passed (no image build or pull performed)."
