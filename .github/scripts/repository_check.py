"""Static repository contract checks. Never builds, pulls, or runs images."""

from __future__ import annotations

import ast
import functools
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
    raise SystemExit("PyYAML is required: pip install -r .github/requirements.txt") from None

from document_rules import PLATFORM_FILES, check_documents

ROOT = pathlib.Path(__file__).resolve().parents[2]

WORKFLOWS = pathlib.Path(".github/workflows")
LINK = re.compile(r"\[[^\]]*\]\(([^)\s]+)\)")
SKIP_PARTS = {
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


def notice(message: str) -> None:
    print(f"notice: {message}")


def files() -> list[pathlib.Path]:
    output = subprocess.run(
        ["git", "ls-files", "-z", "--cached", "--others", "--exclude-standard"],
        check=True,
        capture_output=True,
        text=True,
    ).stdout
    return sorted(
        {pathlib.Path(name) for name in output.split("\0") if name and pathlib.Path(name).is_file()}
    )


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


def category_dirs() -> list[pathlib.Path]:
    return sorted(category for category in pathlib.Path("tools").iterdir() if category.is_dir())


def tool_dirs() -> list[pathlib.Path]:
    return sorted(
        tool for category in category_dirs() for tool in category.iterdir() if tool.is_dir()
    )


@functools.cache
def image_job_scripts() -> frozenset[str]:
    """Scripts run by tool-image.yml and the local modules they import, transitively.

    Tool workflows trigger on exactly these, so editing a repository check or a test
    does not rebuild and republish every image.
    """
    scripts = pathlib.Path(".github/scripts")
    pending = re.findall(
        r"python3 (\.github/scripts/\w+\.py)", (WORKFLOWS / "tool-image.yml").read_text()
    )
    found = set()
    while pending:
        path = pathlib.Path(pending.pop())
        if path.as_posix() in found:
            continue
        found.add(path.as_posix())
        for node in ast.walk(ast.parse(path.read_text())):
            if isinstance(node, ast.Import):
                names = [alias.name for alias in node.names]
            elif isinstance(node, ast.ImportFrom) and node.module:
                names = [node.module]
            else:
                continue
            pending += [
                scripts / f"{name}.py" for name in names if (scripts / f"{name}.py").is_file()
            ]
    return frozenset(found)


# Build args that are set per variant or by CI rather than pinned to an upstream release.
UNPINNED_ARGS = {"DISTRO", "BASE_IMAGE", "OS_REFRESH"}


def strip_jsonc(text: str) -> str:
    """Drop // and /* */ comments outside strings; devcontainer.json is JSON with comments."""
    out, index, length = [], 0, len(text)
    while index < length:
        char = text[index]
        if char == '"':
            end = index + 1
            while end < length and text[end] != '"':
                end += 2 if text[end] == "\\" else 1
            out.append(text[index : end + 1])
            index = end + 1
        elif text.startswith("//", index):
            index = text.find("\n", index)
            index = length if index < 0 else index
        elif text.startswith("/*", index):
            end = text.find("*/", index + 2)
            if end < 0:
                raise ValueError("unterminated /* comment")
            out.append(" ")
            index = end + 2
        else:
            out.append(char)
            index += 1
    return "".join(out)


class RepositoryChecker:
    def __init__(self) -> None:
        self.errors: list[str] = []

    def error(self, message: str) -> None:
        self.errors.append(message)

    def check_workflow_hardening(self, paths: list[pathlib.Path] | None = None) -> None:
        for path in sorted(WORKFLOWS.glob("*.y*ml")) if paths is None else paths:
            document = load(path)
            reusable_only = set(triggers(document)) == {"workflow_call"}
            if document.get("permissions") != {}:
                self.error(f"{path}: workflow must set top-level permissions: {{}}")
            if not reusable_only and not document.get("concurrency"):
                self.error(f"{path}: workflow must declare concurrency")
            for job_id, job in (document.get("jobs") or {}).items():
                where = f"{path}: job {job_id}"
                if not job.get("name"):
                    self.error(f"{where} must declare a display name")
                if "permissions" not in job:
                    self.error(f"{where} must declare explicit token permissions")
                if "uses" in job:
                    continue
                if not job.get("timeout-minutes"):
                    self.error(f"{where} must declare timeout-minutes")
                if "latest" in str(job.get("runs-on", "")):
                    self.error(f"{where} must pin the runner image version")
                for step in job.get("steps") or []:
                    if str(step.get("uses", "")).startswith("actions/checkout@") and (
                        (step.get("with") or {}).get("persist-credentials") is not False
                    ):
                        self.error(f"{where}: checkout must set persist-credentials: false")
                    if step.get("run"):
                        script = re.sub(r"\$\{\{.*?\}\}", "EXPR", step["run"])
                        result = subprocess.run(
                            ["bash", "-n"], input=script, text=True, capture_output=True
                        )
                        if result.returncode:
                            self.error(f"{where}: shell syntax error: {result.stderr.strip()}")
            for line in path.read_text().splitlines():
                match = re.search(r"^\s*(?:-\s+)?uses:\s*([^#\s]+)", line)
                if (
                    match
                    and not match.group(1).startswith("./")
                    and not re.fullmatch(r"[^@]+@[0-9a-f]{40}", match.group(1))
                ):
                    self.error(
                        f"{path}: action must be pinned to a full commit SHA: {line.strip()}"
                    )
                if (
                    match
                    and not match.group(1).startswith("./")
                    and not re.search(r"#\s*v\d", line)
                ):
                    self.error(f"{path}: pinned action needs a '# vX' comment: {line.strip()}")

    def check_pull_request_gate(self) -> None:
        path = WORKFLOWS / "pr.yml"
        if not path.is_file():
            self.error(f"missing {path}")
            return
        document = load(path)
        events = triggers(document)
        if set(events) != {"pull_request", "merge_group", "workflow_dispatch"}:
            self.error(f"{path}: triggers must be pull_request, merge_group, and workflow_dispatch")
        options = events.get("pull_request") or {}
        if any(key in options for key in ("branches", "branches-ignore", "paths", "paths-ignore")):
            self.error(f"{path}: the required gate must not use event filters")
        if set(options.get("types") or []) != {"opened", "edited", "synchronize", "reopened"}:
            self.error(f"{path}: pull_request.types must be opened, edited, synchronize, reopened")
        gate = (document.get("jobs") or {}).get("gate") or {}
        if gate.get("name") != "Pull request gate":
            self.error(f"{path}: gate job name must remain 'Pull request gate'")
        if gate.get("permissions") != {"contents": "read"}:
            self.error(f"{path}: gate must have contents: read only")
        text = path.read_text()
        for needle in (
            ".github/scripts/validate_pr_metadata.py",
            "actions/dependency-review-action@",
            "-r .github/requirements.txt",
            ".github/scripts/check-repo.py",
        ):
            if needle not in text:
                self.error(f"{path}: gate must run {needle}")
        requirements = [
            line.strip()
            for line in pathlib.Path(".github/requirements.txt").read_text().splitlines()
            if line.strip() and not line.lstrip().startswith("#")
        ]
        if len(requirements) != 1 or not re.fullmatch(r"PyYAML==\d+\.\d+\.\d+", requirements[0]):
            self.error(".github/requirements.txt: expected one exact PyYAML pin")

    def check_pipeline_layout(self) -> None:
        for required in ("tool-image.yml", "pr.yml"):
            if not (WORKFLOWS / required).is_file():
                self.error(f"missing workflow {WORKFLOWS / required}")
        obsolete = [
            WORKFLOWS / "images.yml",
            WORKFLOWS / "_image.yml",
            WORKFLOWS / "maintenance.yml",
            WORKFLOWS / "pull-request.yml",
            pathlib.Path(".github/dependabot.yml"),
            pathlib.Path("tools/docker-bake.hcl"),
            pathlib.Path("tools/versions.hcl"),
        ]
        for path in obsolete:
            if path.exists():
                self.error(
                    f"obsolete file remains: {path} (per-tool workflows and tool Dockerfiles replace it)"
                )
        if not pathlib.Path(".github/renovate.json5").is_file():
            self.error("missing .github/renovate.json5")
        ignore = pathlib.Path("tools/trivyignore.yaml")
        if not ignore.is_file():
            self.error("missing tools/trivyignore.yaml")
        else:
            for kind, entries in (load(ignore) or {}).items():
                for entry in entries or []:
                    if not entry.get("statement"):
                        self.error(f"{ignore}: {kind} entry {entry.get('id')} needs a statement")

    def check_issue_forms(self) -> None:
        directory = pathlib.Path(".github/ISSUE_TEMPLATE")
        config = load(directory / "config.yml")
        if config.get("blank_issues_enabled") is not False:
            self.error(f"{directory}/config.yml: blank issues must remain disabled")
        for index, link in enumerate(config.get("contact_links") or []):
            if not isinstance(link, dict) or not all(link.get(k) for k in ("name", "url", "about")):
                self.error(f"{directory}/config.yml: invalid contact link at index {index}")
            elif not link["url"].startswith("https://"):
                self.error(f"{directory}/config.yml: contact link must use HTTPS: {link['url']}")
        expected = {
            "bug-report.yml": {"bug"},
            "feature-request.yml": {"enhancement"},
            "usage-question.yml": {"question"},
        }
        forms = {p.name: p for p in directory.glob("*.yml") if p.name != "config.yml"}
        if set(forms) != set(expected):
            self.error(f"issue forms must be exactly {sorted(expected)}, found {sorted(forms)}")
        for name, path in sorted(forms.items()):
            document = load(path)
            if not all(document.get(k) for k in ("name", "description", "body")):
                self.error(f"{path}: issue form requires name, description, and body")
                continue
            if set(document.get("labels") or []) != expected.get(name, set()):
                self.error(f"{path}: unexpected labels {document.get('labels')}")
            seen: set[str] = set()
            for index, element in enumerate(document["body"]):
                kind = element.get("type")
                attributes = element.get("attributes") or {}
                if kind not in {"checkboxes", "dropdown", "input", "markdown", "textarea"}:
                    self.error(f"{path}: unsupported body type at index {index}: {kind}")
                    continue
                if kind == "markdown":
                    if not attributes.get("value"):
                        self.error(f"{path}: markdown item {index} requires attributes.value")
                    continue
                element_id = element.get("id")
                if (
                    not isinstance(element_id, str)
                    or not re.fullmatch(r"[A-Za-z0-9_-]+", element_id)
                    or element_id in seen
                ):
                    self.error(f"{path}: body item {index} has a missing, invalid, or duplicate id")
                    continue
                seen.add(element_id)
                if not attributes.get("label"):
                    self.error(f"{path}: body item {element_id} requires attributes.label")
                if any(
                    not isinstance(v, bool) for v in (element.get("validations") or {}).values()
                ):
                    self.error(f"{path}: body item {element_id} has invalid validations")
                options = attributes.get("options")
                if kind == "dropdown" and not (
                    isinstance(options, list)
                    and options
                    and all(isinstance(o, str) and o.strip() for o in options)
                ):
                    self.error(f"{path}: dropdown {element_id} requires string options")
                if kind == "checkboxes" and not (
                    isinstance(options, list)
                    and options
                    and all(
                        isinstance(o, dict)
                        and o.get("label")
                        and isinstance(o.get("required", False), bool)
                        for o in options
                    )
                ):
                    self.error(f"{path}: checkboxes {element_id} has invalid options")

    def check_labeler(self) -> None:
        path = WORKFLOWS / "pr-labeler.yml"
        document = load(path)
        if set(triggers(document)) != {"pull_request_target"}:
            self.error(f"{path}: labeler must use pull_request_target only")
        job = (document.get("jobs") or {}).get("label") or {}
        if job.get("permissions") != {"contents": "read", "pull-requests": "write"}:
            self.error(f"{path}: label job permissions changed")
        steps = job.get("steps") or []
        if any(str(s.get("uses", "")).startswith("actions/checkout@") for s in steps):
            self.error(f"{path}: privileged labeler must not check out code")
        if not any(
            str(s.get("uses", "")).startswith("actions/labeler@")
            and (s.get("with") or {}).get("sync-labels") is True
            for s in steps
        ):
            self.error(f"{path}: missing synchronized actions/labeler step")
        rules = pathlib.Path(".github/labeler.yml")
        if set(load(rules)) != {"documentation"} or "**/*.md" not in rules.read_text():
            self.error(f"{rules}: expected the documentation-only label rule")

    def check_web_ui_workflow(self) -> None:
        if not any(p.is_file() and p.name != ".gitkeep" for p in pathlib.Path("web-ui").rglob("*")):
            return
        for path in WORKFLOWS.glob("web-ui*.yml"):
            paths = (triggers(load(path)).get("pull_request") or {}).get("paths") or []
            if "web-ui/**" in paths:
                return
        self.error("web-ui requires a web-ui*.yml workflow with web-ui/** in pull_request.paths")

    def bake_targets(self, tool: pathlib.Path) -> dict:
        if not shutil.which("docker"):
            return {}
        result = subprocess.run(
            ["docker", "buildx", "bake", "--print"], cwd=tool, capture_output=True, text=True
        )
        if result.returncode:
            self.error(
                f"{tool}: docker buildx bake --print failed: {result.stderr.strip().splitlines()[-1:]}"
            )
            return {}
        return json.loads(result.stdout)["target"]

    def check_tool_workflow(self, tool: pathlib.Path) -> None:
        path = WORKFLOWS / f"{tool.parent.name}-{tool.name}.yml"
        if not path.is_file():
            self.error(f"{tool}: missing workflow {path}")
            return
        document = load(path)
        jobs = list((document.get("jobs") or {}).values())
        if len(jobs) != 1 or jobs[0].get("uses") != "./.github/workflows/tool-image.yml":
            self.error(f"{path}: must have one job that calls ./.github/workflows/tool-image.yml")
            return
        if (jobs[0].get("with") or {}).get("tool") != tool.as_posix():
            self.error(f"{path}: with.tool must be {tool.as_posix()}")
        paths = (triggers(document).get("pull_request") or {}).get("paths") or []
        for needed in (
            f"{tool.as_posix()}/**",
            path.as_posix(),
            ".github/workflows/tool-image.yml",
        ):
            if needed not in paths:
                self.error(f"{path}: pull_request.paths must include {needed}")
        scripts = image_job_scripts()
        if {item for item in paths if item.startswith(".github/scripts/")} != scripts:
            self.error(
                f"{path}: pull_request.paths must list exactly the image job scripts: "
                + ", ".join(sorted(scripts))
            )

    def check_tools(self, all_files: list[pathlib.Path]) -> None:
        categories = category_dirs()
        tools = tool_dirs()
        for category in categories:
            if not (category / "README.md").is_file():
                self.error(f"{category}: missing README.md")
        for tool in tools:
            self.check_tool_workflow(tool)
            for name, target in self.bake_targets(tool).items():
                if not {"variant", "distro", "tier"} <= {
                    k.rsplit(".", 1)[-1] for k in target.get("labels", {})
                }:
                    self.error(
                        f"{tool}/docker-bake.hcl: {name} needs variant, distro, and tier labels"
                    )
            for required in ("README.md", "Dockerfile", "docker-bake.hcl", "tests/structure.yaml"):
                if not (tool / required).is_file():
                    self.error(f"{tool}: missing {required}")
            if (tool / "images").exists():
                self.error(f"{tool}: images/ is obsolete; use one Dockerfile per tool")
            if (tool / "examples").exists():
                self.error(f"{tool}: examples/ is obsolete; use docs/<platform>/")
            docs = tool / "docs"
            platforms = sorted(p for p in docs.iterdir() if p.is_dir()) if docs.is_dir() else []
            if not platforms:
                self.error(f"{tool}: missing docs/<platform>/")
            for platform in platforms:
                required = PLATFORM_FILES.get(platform.name)
                if required and not (platform / required).is_file():
                    self.error(f"{platform}: missing {required}")
                readme = platform / "README.md"
                if not readme.is_file():
                    self.error(f"{platform}: missing README.md")
                    continue
                linked = {(platform / target).resolve() for target in local_links(readme) if target}
                for path in all_files:
                    if platform in path.parents and path != readme and path.resolve() not in linked:
                        self.error(f"{readme}: does not link {path.relative_to(platform)}")

        for path in all_files:
            if path.parts[0] == "tools" and path.name == "Dockerfile":
                text = path.read_text()
                if not text.startswith("# syntax=docker/dockerfile:1"):
                    self.error(f"{path}: first line must be '# syntax=docker/dockerfile:1'")
                self.check_pins(path, text)
                if re.search(
                    r"apk\s+upgrade|apt-get\s+(dist-)?upgrade|apt\s+(full-|dist-)?upgrade", text
                ):
                    self.error(f"{path}: use OS_REFRESH instead of upgrading packages")

        documents = {
            path.as_posix(): path.read_text()
            for path in all_files
            if path.name == "README.md"
            and (path.parent == pathlib.Path(".") or path.parts[0] == "tools")
        }
        for path, problem in check_documents(documents):
            self.error(f"{path}: {problem}")

        links = [
            target.removeprefix("./").rstrip("/")
            for target in LINK.findall(documents.get("README.md", ""))
        ]
        for kind, pattern, expected in (
            ("category", r"tools/[^/]+", {category.as_posix() for category in categories}),
            ("catalog", r"tools/[^/]+/[^/]+", {tool.as_posix() for tool in tools}),
        ):
            found = [link for link in links if re.fullmatch(pattern, link)]
            if len(found) != len(set(found)):
                self.error(f"README.md: duplicate {kind} link")
            if set(found) != expected:
                self.error(
                    f"README.md {kind} links mismatch: missing={sorted(expected - set(found))}, unexpected={sorted(set(found) - expected)}"
                )

    def check_pins(self, path: pathlib.Path, text: str) -> None:
        """Every ARG with a default is a pin Renovate must be able to update."""
        lines = text.splitlines()
        for index, line in enumerate(lines):
            match = re.match(r"ARG (\w+)=", line)
            if (
                match
                and match.group(1) not in UNPINNED_ARGS
                and not lines[index - 1].startswith("# renovate: ")
            ):
                self.error(
                    f"{path}: ARG {match.group(1)} needs a '# renovate:' comment on the line above"
                )
            elif "@sha256:" in line and not match:
                self.error(
                    f"{path}: pin image digests in an ARG default, not inline: {line.strip()}"
                )

    def check_files(self, all_files: list[pathlib.Path]) -> None:
        for path in all_files:
            posix = path.as_posix()
            must_execute = (
                (posix.startswith(".github/scripts/") and path.suffix == ".sh")
                or (
                    posix.startswith("tools/")
                    and path.suffix == ".sh"
                    and {"docs", "tests"} & set(path.parts)
                )
                or posix.startswith("tools/base/devbox/scripts/")
            )
            if must_execute and not os.access(path, os.X_OK):
                self.error(f"{path}: must be executable")
            if path.parent == pathlib.Path(".github/scripts") and path.suffix == ".py":
                try:
                    ast.parse(path.read_text(encoding="utf-8"), filename=str(path))
                except SyntaxError as exc:
                    self.error(f"{path}: invalid Python: {exc}")
            if path.suffix == ".sh":
                result = subprocess.run(["bash", "-n", str(path)], capture_output=True, text=True)
                if result.returncode:
                    self.error(f"{path}: {result.stderr.strip()}")
            if path.suffix == ".md" and not SKIP_PARTS & set(path.parts):
                for target in local_links(path):
                    if target and not (path.parent / target).exists():
                        self.error(f"{path}: missing local link {target}")

    def check_renders(self, all_files: list[pathlib.Path]) -> None:
        env = {
            **os.environ,
            "WORKSPACE": str(ROOT),
            "OPENAI_API_KEY": "validation",
            "ANTHROPIC_API_KEY": "validation",
        }
        composes = [p for p in all_files if "compose" in p.name and p.suffix in {".yml", ".yaml"}]
        if (
            shutil.which("docker")
            and subprocess.run(["docker", "compose", "version"], capture_output=True).returncode
            == 0
        ):
            for path in composes:
                result = subprocess.run(
                    ["docker", "compose", "-f", str(path), "config", "--quiet"],
                    env=env,
                    capture_output=True,
                    text=True,
                )
                if result.returncode:
                    self.error(f"{path}: docker compose config failed: {result.stderr.strip()}")
        else:
            notice("Docker Compose unavailable; skipped compose render")
        charts = sorted({p.parent for p in all_files if p.name == "Chart.yaml"})
        if shutil.which("helm"):
            for chart in charts:
                for command in (
                    ["helm", "lint", str(chart)],
                    ["helm", "template", "validation", str(chart)],
                ):
                    result = subprocess.run(command, capture_output=True, text=True)
                    if result.returncode:
                        self.error(
                            f"{chart}: {' '.join(command[:2])} failed: {(result.stdout + result.stderr).strip()[-500:]}"
                        )
        else:
            notice("Helm unavailable; skipped lint/template")

    def check_platform_files(self, all_files: list[pathlib.Path]) -> None:
        def in_platform(path: pathlib.Path, platform: str) -> bool:
            return (
                path.parts[0] == "tools"
                and len(path.parts) > 2
                and path.parts[-2] == platform
                and path.parts[-3] == "docs"
            )

        workflows = [
            p
            for p in all_files
            if in_platform(p, "github-actions") and p.suffix in {".yml", ".yaml"}
        ]
        self.check_workflow_hardening(workflows)
        if workflows and shutil.which("actionlint"):
            result = subprocess.run(
                ["actionlint", *map(str, workflows)], capture_output=True, text=True
            )
            if result.returncode:
                self.error(f"actionlint failed:\n{(result.stdout + result.stderr).strip()}")
        elif workflows:
            notice("actionlint unavailable; skipped docs/github-actions lint")
        for path in (
            p for p in all_files if in_platform(p, "gitlab-ci") and p.suffix in {".yml", ".yaml"}
        ):
            try:
                document = yaml.safe_load(path.read_text())
            except yaml.YAMLError as exc:
                self.error(f"{path}: invalid YAML: {exc}")
                continue
            if not isinstance(document, dict):
                self.error(f"{path}: GitLab CI configuration must be a mapping")
                continue
            for job_id, job in document.items():
                if isinstance(job, dict) and isinstance(job.get("script"), list):
                    script = "\n".join(map(str, job["script"]))
                    result = subprocess.run(
                        ["bash", "-n"], input=script, text=True, capture_output=True
                    )
                    if result.returncode:
                        self.error(
                            f"{path}: job {job_id}: shell syntax error: {result.stderr.strip()}"
                        )
        for path in (
            p for p in all_files if in_platform(p, "devcontainer") and p.suffix == ".json"
        ):
            try:
                document = json.loads(strip_jsonc(path.read_text()))
            except ValueError as exc:
                self.error(f"{path}: invalid JSONC: {exc}")
                continue
            if not isinstance(document, dict) or not document.get("image"):
                self.error(f"{path}: devcontainer.json must set image")

    def run_suites(self) -> None:
        for command in (
            ["bash", ".agents/skills/maintain-agent-workspace/scripts/check-agent-workspace.sh"],
            [
                "bash",
                ".agents/skills/maintain-agent-workspace/scripts/test-check-agent-workspace.sh",
            ],
            [
                sys.executable,
                "-B",
                "-m",
                "unittest",
                "discover",
                "-s",
                ".github/scripts",
                "-p",
                "test_*.py",
            ],
        ):
            result = subprocess.run(command, capture_output=True, text=True)
            if result.returncode:
                self.error(
                    f"{' '.join(command)} failed:\n{(result.stdout + result.stderr).strip()}"
                )

    def validate(self) -> int:
        all_files = files()
        self.run_suites()
        self.check_workflow_hardening()
        self.check_pull_request_gate()
        self.check_pipeline_layout()
        self.check_issue_forms()
        self.check_labeler()
        self.check_web_ui_workflow()
        self.check_tools(all_files)
        self.check_files(all_files)
        self.check_renders(all_files)
        self.check_platform_files(all_files)
        for message in self.errors:
            print(f"error: {message}", file=sys.stderr)
        if self.errors:
            return 1
        print("Static repository checks passed (no image build or pull performed).")
        return 0


def main() -> int:
    previous = pathlib.Path.cwd()
    try:
        os.chdir(ROOT)
        return RepositoryChecker().validate()
    finally:
        os.chdir(previous)


if __name__ == "__main__":
    sys.exit(main())
