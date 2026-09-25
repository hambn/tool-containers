#!/usr/bin/env python3
"""Static repository contract checks. Never builds, pulls, or runs images."""

from __future__ import annotations

import json
import os
import pathlib
import re
import shutil
import subprocess
import sys

try:
    import yaml
except ImportError:
    raise SystemExit("PyYAML is required: pip install -r .github/requirements.txt")

ROOT = pathlib.Path(subprocess.run(
    ["git", "rev-parse", "--show-toplevel"], check=True, capture_output=True, text=True
).stdout.strip())
os.chdir(ROOT)

WORKFLOWS = pathlib.Path(".github/workflows")
LINK = re.compile(r"\[[^\]]*\]\(([^)\s]+)\)")
SKIP_PARTS = {".git", ".tmp", ".codex", ".claude", "node_modules", "dist", "build", "coverage", ".venv"}
errors: list[str] = []


def error(message: str) -> None:
    errors.append(message)


def notice(message: str) -> None:
    print(f"notice: {message}")


def files() -> list[pathlib.Path]:
    output = subprocess.run(
        ["git", "ls-files", "-z", "--cached", "--others", "--exclude-standard"],
        check=True, capture_output=True, text=True,
    ).stdout
    return sorted({pathlib.Path(name) for name in output.split("\0") if name and pathlib.Path(name).is_file()})


def load(path: pathlib.Path) -> dict:
    return yaml.safe_load(path.read_text()) or {}


def triggers(document: dict) -> dict:
    return document.get("on", document.get(True, {})) or {}


def local_links(path: pathlib.Path) -> list[str]:
    return [
        target.split("#", 1)[0]
        for target in LINK.findall(path.read_text())
        if not re.match(r"^([a-z][a-z0-9+.-]*:|#)", target) and "<" not in target
    ]


# --- workflows ---------------------------------------------------------------

def check_workflow_hardening() -> None:
    for path in sorted(WORKFLOWS.glob("*.y*ml")):
        document = load(path)
        reusable_only = set(triggers(document)) == {"workflow_call"}
        if document.get("permissions") != {}:
            error(f"{path}: workflow must set top-level permissions: {{}}")
        if not reusable_only and not document.get("concurrency"):
            error(f"{path}: workflow must declare concurrency")
        for job_id, job in (document.get("jobs") or {}).items():
            where = f"{path}: job {job_id}"
            if not job.get("name"):
                error(f"{where} must declare a display name")
            if "permissions" not in job:
                error(f"{where} must declare explicit token permissions")
            if "uses" in job:
                continue
            if not job.get("timeout-minutes"):
                error(f"{where} must declare timeout-minutes")
            if "latest" in str(job.get("runs-on", "")):
                error(f"{where} must pin the runner image version")
            for step in job.get("steps") or []:
                if str(step.get("uses", "")).startswith("actions/checkout@") and (
                    (step.get("with") or {}).get("persist-credentials") is not False
                ):
                    error(f"{where}: checkout must set persist-credentials: false")
                if step.get("run"):
                    script = re.sub(r"\$\{\{.*?\}\}", "EXPR", step["run"])
                    result = subprocess.run(["bash", "-n"], input=script, text=True, capture_output=True)
                    if result.returncode:
                        error(f"{where}: shell syntax error: {result.stderr.strip()}")
        for line in path.read_text().splitlines():
            match = re.search(r"^\s*(?:-\s+)?uses:\s*([^#\s]+)", line)
            if match and not match.group(1).startswith("./") and not re.fullmatch(r"[^@]+@[0-9a-f]{40}", match.group(1)):
                error(f"{path}: action must be pinned to a full commit SHA: {line.strip()}")
            if match and not match.group(1).startswith("./") and not re.search(r"#\s*v\d", line):
                error(f"{path}: pinned action needs a '# vX' comment: {line.strip()}")


def check_pull_request_gate() -> None:
    path = WORKFLOWS / "pr.yml"
    if not path.is_file():
        error(f"missing {path}")
        return
    document = load(path)
    events = triggers(document)
    if set(events) != {"pull_request", "merge_group", "workflow_dispatch"}:
        error(f"{path}: triggers must be pull_request, merge_group, and workflow_dispatch")
    options = events.get("pull_request") or {}
    if any(key in options for key in ("branches", "branches-ignore", "paths", "paths-ignore")):
        error(f"{path}: the required gate must not use event filters")
    if set(options.get("types") or []) != {"opened", "edited", "synchronize", "reopened"}:
        error(f"{path}: pull_request.types must be opened, edited, synchronize, reopened")
    gate = (document.get("jobs") or {}).get("gate") or {}
    if gate.get("name") != "Pull request gate":
        error(f"{path}: gate job name must remain 'Pull request gate'")
    if gate.get("permissions") != {"contents": "read"}:
        error(f"{path}: gate must have contents: read only")
    text = path.read_text()
    for needle in (
        ".github/scripts/validate_pr_metadata.py",
        "actions/dependency-review-action@",
        "-r .github/requirements.txt",
        ".github/scripts/check-repo.py",
    ):
        if needle not in text:
            error(f"{path}: gate must run {needle}")
    requirements = [
        line.strip()
        for line in pathlib.Path(".github/requirements.txt").read_text().splitlines()
        if line.strip() and not line.lstrip().startswith("#")
    ]
    if len(requirements) != 1 or not re.fullmatch(r"PyYAML==\d+\.\d+\.\d+", requirements[0]):
        error(".github/requirements.txt: expected one exact PyYAML pin")


def check_pipeline_layout() -> None:
    for required in ("images.yml", "maintenance.yml", "pr.yml"):
        if not (WORKFLOWS / required).is_file():
            error(f"missing workflow {WORKFLOWS / required}")
    obsolete = [p for p in WORKFLOWS.glob("*.yml") if p.name.startswith(("ai-", "base-")) or p.name == "pull-request.yml"]
    obsolete += [p for p in (pathlib.Path(".github/dependabot.yml"),) if p.exists()]
    for path in obsolete:
        error(f"obsolete file remains: {path} (images.yml and .github/renovate.json5 replace it)")
    if not pathlib.Path(".github/renovate.json5").is_file():
        error("missing .github/renovate.json5")
    ignore = pathlib.Path("tools/trivyignore.yaml")
    if not ignore.is_file():
        error("missing tools/trivyignore.yaml")
    else:
        for kind, entries in (load(ignore) or {}).items():
            for entry in entries or []:
                if not entry.get("statement"):
                    error(f"{ignore}: {kind} entry {entry.get('id')} needs a statement")


def check_issue_forms() -> None:
    directory = pathlib.Path(".github/ISSUE_TEMPLATE")
    config = load(directory / "config.yml")
    if config.get("blank_issues_enabled") is not False:
        error(f"{directory}/config.yml: blank issues must remain disabled")
    for index, link in enumerate(config.get("contact_links") or []):
        if not isinstance(link, dict) or not all(link.get(k) for k in ("name", "url", "about")):
            error(f"{directory}/config.yml: invalid contact link at index {index}")
        elif not link["url"].startswith("https://"):
            error(f"{directory}/config.yml: contact link must use HTTPS: {link['url']}")
    expected = {"bug-report.yml": {"bug"}, "feature-request.yml": {"enhancement"}, "usage-question.yml": {"question"}}
    forms = {p.name: p for p in directory.glob("*.yml") if p.name != "config.yml"}
    if set(forms) != set(expected):
        error(f"issue forms must be exactly {sorted(expected)}, found {sorted(forms)}")
    for name, path in sorted(forms.items()):
        document = load(path)
        if not all(document.get(k) for k in ("name", "description", "body")):
            error(f"{path}: issue form requires name, description, and body")
            continue
        if set(document.get("labels") or []) != expected.get(name, set()):
            error(f"{path}: unexpected labels {document.get('labels')}")
        seen: set[str] = set()
        for index, element in enumerate(document["body"]):
            kind = element.get("type")
            attributes = element.get("attributes") or {}
            if kind not in {"checkboxes", "dropdown", "input", "markdown", "textarea"}:
                error(f"{path}: unsupported body type at index {index}: {kind}")
                continue
            if kind == "markdown":
                if not attributes.get("value"):
                    error(f"{path}: markdown item {index} requires attributes.value")
                continue
            element_id = element.get("id")
            if not isinstance(element_id, str) or not re.fullmatch(r"[A-Za-z0-9_-]+", element_id) or element_id in seen:
                error(f"{path}: body item {index} has a missing, invalid, or duplicate id")
                continue
            seen.add(element_id)
            if not attributes.get("label"):
                error(f"{path}: body item {element_id} requires attributes.label")
            if any(not isinstance(v, bool) for v in (element.get("validations") or {}).values()):
                error(f"{path}: body item {element_id} has invalid validations")
            options = attributes.get("options")
            if kind == "dropdown" and not (
                isinstance(options, list) and options and all(isinstance(o, str) and o.strip() for o in options)
            ):
                error(f"{path}: dropdown {element_id} requires string options")
            if kind == "checkboxes" and not (
                isinstance(options, list) and options
                and all(isinstance(o, dict) and o.get("label") and isinstance(o.get("required", False), bool) for o in options)
            ):
                error(f"{path}: checkboxes {element_id} has invalid options")


def check_labeler() -> None:
    path = WORKFLOWS / "pr-labeler.yml"
    document = load(path)
    if set(triggers(document)) != {"pull_request_target"}:
        error(f"{path}: labeler must use pull_request_target only")
    job = (document.get("jobs") or {}).get("label") or {}
    if job.get("permissions") != {"contents": "read", "pull-requests": "write"}:
        error(f"{path}: label job permissions changed")
    steps = job.get("steps") or []
    if any(str(s.get("uses", "")).startswith("actions/checkout@") for s in steps):
        error(f"{path}: privileged labeler must not check out code")
    if not any(
        str(s.get("uses", "")).startswith("actions/labeler@") and (s.get("with") or {}).get("sync-labels") is True
        for s in steps
    ):
        error(f"{path}: missing synchronized actions/labeler step")
    rules = pathlib.Path(".github/labeler.yml")
    if set(load(rules)) != {"documentation"} or "**/*.md" not in rules.read_text():
        error(f"{rules}: expected the documentation-only label rule")


def check_web_ui_workflow() -> None:
    if not any(p.is_file() and p.name != ".gitkeep" for p in pathlib.Path("web-ui").rglob("*")):
        return
    for path in WORKFLOWS.glob("web-ui*.yml"):
        paths = (triggers(load(path)).get("pull_request") or {}).get("paths") or []
        if "web-ui/**" in paths:
            return
    error("web-ui requires a web-ui*.yml workflow with web-ui/** in pull_request.paths")


# --- tools and bake ----------------------------------------------------------

def bake_contexts() -> set[str]:
    if shutil.which("docker"):
        result = subprocess.run(
            [".github/scripts/bake.sh", "--print", "all"],
            capture_output=True, text=True,
        )
        if result.returncode == 0:
            return {t["context"] for t in json.loads(result.stdout)["target"].values() if "context" in t}
        error(f"docker buildx bake --print failed: {result.stderr.strip().splitlines()[-1:]}")
    else:
        notice("docker unavailable; reading bake contexts with a regex")
    return set(re.findall(r'^\s*context\s*=\s*"([^"]+)"', pathlib.Path("tools/docker-bake.hcl").read_text(), re.MULTILINE))


def tool_dirs() -> list[pathlib.Path]:
    return sorted(tool for category in pathlib.Path("tools").iterdir() if category.is_dir()
                  for tool in category.iterdir() if tool.is_dir())


def check_tools(all_files: list[pathlib.Path]) -> None:
    tools = tool_dirs()
    names = {tool.as_posix() for tool in tools}
    contexts = bake_contexts()
    for missing in sorted(names - contexts):
        error(f"{missing}: no bake target uses it as context")
    for missing in sorted(contexts - names):
        error(f"tools/docker-bake.hcl: context {missing} is not a tools/<category>/<tool> directory")
    for tool in tools:
        for required in ("README.md", "Dockerfile", "tests/structure.yaml"):
            if not (tool / required).is_file():
                error(f"{tool}: missing {required}")
        if (tool / "images").exists():
            error(f"{tool}: images/ is obsolete; use one Dockerfile per tool")
        examples = tool / "examples"
        platforms = sorted(p for p in examples.iterdir() if p.is_dir()) if examples.is_dir() else []
        if not platforms:
            error(f"{tool}: missing examples/<platform>/")
        for platform in platforms:
            readme = platform / "README.md"
            if not readme.is_file():
                error(f"{platform}: missing README.md")
                continue
            linked = {(platform / target).resolve() for target in local_links(readme) if target}
            for path in all_files:
                if platform in path.parents and path != readme and path.resolve() not in linked:
                    error(f"{readme}: does not link {path.relative_to(platform)}")

    for path in all_files:
        if path.parts[0] == "tools" and path.name == "Dockerfile":
            text = path.read_text()
            if not text.startswith("# syntax=docker/dockerfile:1"):
                error(f"{path}: first line must be '# syntax=docker/dockerfile:1'")
            if "@sha256:" in text:
                error(f"{path}: base image digests belong in tools/versions.hcl")
            if re.search(r"apk\s+upgrade|apt-get\s+(dist-)?upgrade|apt\s+(full-|dist-)?upgrade", text):
                error(f"{path}: use OS_REFRESH instead of upgrading packages")

    links = (target.removeprefix("./").rstrip("/") for target in LINK.findall(pathlib.Path("README.md").read_text()))
    catalog = [link for link in links if re.fullmatch(r"tools/[^/]+/[^/]+", link)]
    if len(catalog) != len(set(catalog)):
        error("README.md: duplicate catalog link")
    if set(catalog) != names:
        error(f"README.md catalog mismatch: missing={sorted(names - set(catalog))}, unexpected={sorted(set(catalog) - names)}")


def check_versions() -> None:
    lines = pathlib.Path("tools/versions.hcl").read_text().splitlines()
    for index, line in enumerate(lines):
        match = re.match(r'variable "(\w+)"', line)
        if match and match.group(1) != "OS_REFRESH" and not (index and lines[index - 1].startswith("# renovate: ")):
            error(f"tools/versions.hcl: {match.group(1)} needs a '# renovate:' comment on the line above")


# --- files -------------------------------------------------------------------

def check_files(all_files: list[pathlib.Path]) -> None:
    for path in all_files:
        posix = path.as_posix()
        must_execute = (
            (posix.startswith(".github/scripts/") and path.suffix == ".sh")
            or (posix.startswith("tools/") and path.suffix == ".sh" and {"examples", "tests"} & set(path.parts))
            or posix.startswith("tools/base/devbox/scripts/")
        )
        if must_execute and not os.access(path, os.X_OK):
            error(f"{path}: must be executable")
        if path.suffix == ".sh":
            result = subprocess.run(["bash", "-n", str(path)], capture_output=True, text=True)
            if result.returncode:
                error(f"{path}: {result.stderr.strip()}")
        if path.suffix == ".md" and not SKIP_PARTS & set(path.parts):
            for target in local_links(path):
                if target and not (path.parent / target).exists():
                    error(f"{path}: missing local link {target}")


def check_renders(all_files: list[pathlib.Path]) -> None:
    env = {**os.environ, "WORKSPACE": str(ROOT), "OPENAI_API_KEY": "validation", "ANTHROPIC_API_KEY": "validation"}
    composes = [p for p in all_files if "compose" in p.name and p.suffix in {".yml", ".yaml"}]
    if shutil.which("docker") and subprocess.run(["docker", "compose", "version"], capture_output=True).returncode == 0:
        for path in composes:
            result = subprocess.run(["docker", "compose", "-f", str(path), "config", "--quiet"], env=env, capture_output=True, text=True)
            if result.returncode:
                error(f"{path}: docker compose config failed: {result.stderr.strip()}")
    else:
        notice("Docker Compose unavailable; skipped compose render")
    charts = sorted({p.parent for p in all_files if p.name == "Chart.yaml"})
    if shutil.which("helm"):
        for chart in charts:
            for command in (["helm", "lint", str(chart)], ["helm", "template", "validation", str(chart)]):
                result = subprocess.run(command, capture_output=True, text=True)
                if result.returncode:
                    error(f"{chart}: {' '.join(command[:2])} failed: {(result.stdout + result.stderr).strip()[-500:]}")
    else:
        notice("Helm unavailable; skipped lint/template")


def run_suites() -> None:
    for command in (
        ["bash", ".agents/skills/maintain-agent-workspace/scripts/check-agent-workspace.sh"],
        ["bash", ".agents/skills/maintain-agent-workspace/scripts/test-check-agent-workspace.sh"],
        [sys.executable, "-B", ".github/scripts/test_validate_pr_metadata.py"],
        [sys.executable, "-B", ".github/scripts/test_plan.py"],
        [sys.executable, "-B", ".github/scripts/test_build_tools.py"],
    ):
        result = subprocess.run(command, capture_output=True, text=True)
        if result.returncode:
            error(f"{' '.join(command)} failed:\n{(result.stdout + result.stderr).strip()}")


def main() -> int:
    all_files = files()
    run_suites()
    check_workflow_hardening()
    check_pull_request_gate()
    check_pipeline_layout()
    check_issue_forms()
    check_labeler()
    check_web_ui_workflow()
    check_tools(all_files)
    check_versions()
    check_files(all_files)
    check_renders(all_files)
    for message in errors:
        print(f"error: {message}", file=sys.stderr)
    if errors:
        return 1
    print("Static repository checks passed (no image build or pull performed).")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
