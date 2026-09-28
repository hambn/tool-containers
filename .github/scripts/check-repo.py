#!/usr/bin/env python3
"""Static repository contract checks. Never builds, pulls, or runs images."""

from __future__ import annotations

import datetime
import json
import math
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

def check_workflow_hardening(paths: list[pathlib.Path] | None = None) -> None:
    for path in sorted(WORKFLOWS.glob("*.y*ml")) if paths is None else paths:
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
    for required in ("tool-image.yml", "pr.yml"):
        if not (WORKFLOWS / required).is_file():
            error(f"missing workflow {WORKFLOWS / required}")
    obsolete = [WORKFLOWS / "images.yml", WORKFLOWS / "_image.yml", WORKFLOWS / "maintenance.yml", WORKFLOWS / "pull-request.yml", pathlib.Path(".github/dependabot.yml"),
                pathlib.Path("tools/docker-bake.hcl"), pathlib.Path("tools/versions.hcl")]
    for path in obsolete:
        if path.exists():
            error(f"obsolete file remains: {path} (per-tool workflows and tool Dockerfiles replace it)")
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

def bake_targets(tool: pathlib.Path) -> dict:
    if not shutil.which("docker"):
        return {}
    result = subprocess.run(["docker", "buildx", "bake", "--print"], cwd=tool, capture_output=True, text=True)
    if result.returncode:
        error(f"{tool}: docker buildx bake --print failed: {result.stderr.strip().splitlines()[-1:]}")
        return {}
    return json.loads(result.stdout)["target"]


def check_tool_workflow(tool: pathlib.Path) -> None:
    path = WORKFLOWS / f"{tool.parent.name}-{tool.name}.yml"
    if not path.is_file():
        error(f"{tool}: missing workflow {path}")
        return
    document = load(path)
    jobs = list((document.get("jobs") or {}).values())
    if len(jobs) != 1 or jobs[0].get("uses") != "./.github/workflows/tool-image.yml":
        error(f"{path}: must have one job that calls ./.github/workflows/tool-image.yml")
        return
    if (jobs[0].get("with") or {}).get("tool") != tool.as_posix():
        error(f"{path}: with.tool must be {tool.as_posix()}")
    paths = (triggers(document).get("pull_request") or {}).get("paths") or []
    for needed in (f"{tool.as_posix()}/**", path.as_posix(), ".github/workflows/tool-image.yml"):
        if needed not in paths:
            error(f"{path}: pull_request.paths must include {needed}")


def category_dirs() -> list[pathlib.Path]:
    return sorted(category for category in pathlib.Path("tools").iterdir() if category.is_dir())


def tool_dirs() -> list[pathlib.Path]:
    return sorted(tool for category in category_dirs() for tool in category.iterdir() if tool.is_dir())


def check_tools(all_files: list[pathlib.Path]) -> None:
    categories = category_dirs()
    tools = tool_dirs()
    for category in categories:
        if not (category / "README.md").is_file():
            error(f"{category}: missing README.md")
    for tool in tools:
        check_tool_workflow(tool)
        for name, target in bake_targets(tool).items():
            if not {"variant", "distro", "tier"} <= {k.rsplit(".", 1)[-1] for k in target.get("labels", {})}:
                error(f"{tool}/docker-bake.hcl: {name} needs variant, distro, and tier labels")
        for required in ("README.md", "Dockerfile", "docker-bake.hcl", "tests/structure.yaml"):
            if not (tool / required).is_file():
                error(f"{tool}: missing {required}")
        if (tool / "images").exists():
            error(f"{tool}: images/ is obsolete; use one Dockerfile per tool")
        if (tool / "examples").exists():
            error(f"{tool}: examples/ is obsolete; use docs/<platform>/")
        docs = tool / "docs"
        platforms = sorted(p for p in docs.iterdir() if p.is_dir()) if docs.is_dir() else []
        if not platforms:
            error(f"{tool}: missing docs/<platform>/")
        for platform in platforms:
            required = PLATFORM_FILES.get(platform.name)
            if required and not (platform / required).is_file():
                error(f"{platform}: missing {required}")
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
            check_pins(path, text)
            if re.search(r"apk\s+upgrade|apt-get\s+(dist-)?upgrade|apt\s+(full-|dist-)?upgrade", text):
                error(f"{path}: use OS_REFRESH instead of upgrading packages")

    documents = {
        path.as_posix(): path.read_text() for path in all_files
        if path.name == "README.md" and (path.parent == pathlib.Path(".") or path.parts[0] == "tools")
    }
    for path, problem in check_documents(documents):
        error(f"{path}: {problem}")

    links = [target.removeprefix("./").rstrip("/") for target in LINK.findall(documents.get("README.md", ""))]
    for kind, pattern, expected in (
        ("category", r"tools/[^/]+", {category.as_posix() for category in categories}),
        ("catalog", r"tools/[^/]+/[^/]+", {tool.as_posix() for tool in tools}),
    ):
        found = [link for link in links if re.fullmatch(pattern, link)]
        if len(found) != len(set(found)):
            error(f"README.md: duplicate {kind} link")
        if set(found) != expected:
            error(f"README.md {kind} links mismatch: missing={sorted(expected - set(found))}, unexpected={sorted(set(found) - expected)}")


# --- documents -----------------------------------------------------------------
# The document contract (.agents/skills/documentation/SKILL.md): frontmatter the web UI
# publishes, cross-document uniqueness and order, and category Tools sections.
# web-ui/src/lib/frontmatter.mjs and content.mjs implement the same rules; both run the
# shared cases in web-ui/tests/fixtures/documents.yaml (see test_check_repo.py).

FRONTMATTER = re.compile(r"---\r?\n(.*?)\r?\n---[ \t]*(?:\r?\n|\Z)", re.S)
CATEGORY_README = re.compile(r"tools/([^/]+)/README\.md")
TOOL_README = re.compile(r"tools/([^/]+)/([^/]+)/README\.md")
PLATFORM_README = re.compile(r"tools/([^/]+)/([^/]+)/docs/([^/]+)/README\.md")
PLATFORM_NAMES = {
    "docker": "Docker", "docker-compose": "Docker Compose", "podman": "Podman",
    "kubernetes": "Kubernetes", "helm": "Helm", "github-actions": "GitHub Actions",
    "gitlab-ci": "GitLab CI", "devcontainer": "Dev Container",
}
# The runnable file each CI and editor platform directory must contain.
PLATFORM_FILES = {"github-actions": "workflow.yml", "gitlab-ci": "gitlab-ci.yml", "devcontainer": "devcontainer.json"}
REGISTRIES = ("ghcr.io/hambn/", "docker.io/hambn/")
DESCRIPTION_LENGTH = (110, 160)
USECASE_MAX = 80
# Plain strings reach meta tags and JSON-LD verbatim: no code, emphasis, HTML, links, or headings.
MARKUP = re.compile(r"[`*<>]|\]\(|^#|(?:^|[^A-Za-z0-9])_|_(?:[^A-Za-z0-9]|$)")
HTTPS_URL = re.compile(r"https://[A-Za-z0-9.-]+(?::[0-9]+)?(?:[/?#]\S*)?")
TOOLS_SECTION = "Tools"
TOOL_BULLET = re.compile(r"- \[[^\]]+\]\(\./([^/()\s]+)/\) — (\S.*)")
NOT_PROSE = re.compile(r"\]\(|<")


class StrictLoader(yaml.SafeLoader):
    """SafeLoader that rejects duplicate mapping keys instead of keeping the last."""


def _construct_unique_mapping(loader: StrictLoader, node: yaml.MappingNode, deep: bool = False) -> dict:
    seen = set()
    for key_node, _ in node.value:
        key = loader.construct_object(key_node, deep=deep)
        try:
            duplicate = key in seen
        except TypeError:
            continue
        if duplicate:
            raise yaml.constructor.ConstructorError(None, None, f"duplicate key {key!r}", key_node.start_mark)
        seen.add(key)
    return loader.construct_mapping(node, deep)


StrictLoader.add_constructor(yaml.resolver.BaseResolver.DEFAULT_MAPPING_TAG, _construct_unique_mapping)


def type_name(value: object) -> str:
    if value is None:
        return "null"
    return {bool: "boolean", int: "integer", float: "float", str: "string", list: "list", dict: "mapping"}.get(
        type(value), "date" if isinstance(value, (datetime.date, datetime.datetime)) else type(value).__name__)


def split_frontmatter(text: str) -> tuple[dict | None, str, str]:
    """Return (data, body, error); data is None without frontmatter."""
    match = FRONTMATTER.match(text)
    if not match:
        return None, text, ""
    body = text[match.end():]
    try:
        data = yaml.load(match.group(1), Loader=StrictLoader)
    except yaml.YAMLError as exc:
        return {}, body, f"invalid YAML frontmatter: {str(exc).splitlines()[0]}"
    if type(data) is not dict:
        return {}, body, f"frontmatter must be a YAML mapping, got {type_name(data)}"
    return data, body, ""


def plain_problem(value: object) -> str:
    if type(value) is not str:
        return f"expected string, got {type_name(value)}"
    text = value.strip()
    if not text:
        return "must not be empty"
    if "\n" in text or "\r" in text:
        return "must be a single line"
    if MARKUP.search(text):
        return "must be plain text without Markdown or HTML"
    return ""


def plain(extra=None):
    def check(value, slug):
        return plain_problem(value) or (extra(value.strip(), slug) if extra else "")
    return check, str.strip


def plain_list(low: int, high: int, extra=None):
    def check(value, slug):
        if type(value) is not list:
            return f"expected list, got {type_name(value)}"
        for item in value:
            if problem := plain_problem(item):
                return f"items: {problem}"
        if not low <= len(value) <= high:
            return f"must list {low}-{high} items, got {len(value)}"
        seen = set()
        for item in value:
            if item.strip().lower() in seen:
                return f'lists "{item.strip()}" more than once'
            seen.add(item.strip().lower())
        return extra([item.strip() for item in value], slug) if extra else ""
    return check, lambda value: [item.strip() for item in value]


def _name(value, slug):
    return "" if value == slug else f'must equal the directory name "{slug}", got "{value}"'


def _description(value, slug):
    low, high = DESCRIPTION_LENGTH
    return "" if low <= len(value) <= high else f"must be {low}-{high} characters, got {len(value)}"


def _order(value, slug):
    return "" if type(value) is int and value >= 1 else f"must be an integer of at least 1, got {type_name(value)} {value}"


def _images(value, slug):
    allowed = [f"{registry}{slug}" for registry in REGISTRIES]
    bad = next((image for image in value if image not in allowed), None)
    if bad:
        return f'"{bad}" is not one of {", ".join(allowed)}'
    return "" if value[0] == allowed[0] else f"must list {allowed[0]} first"


def _upstream(value, slug):
    return "" if HTTPS_URL.fullmatch(value) else f'must be an https URL, got "{value}"'


def _platform_name(value, slug):
    expected = PLATFORM_NAMES.get(slug)
    return "" if value == expected else f'must be "{expected}" for docs/{slug}/, got "{value}"'


def _usecase(value, slug):
    return "" if len(value) <= USECASE_MAX else f"must be at most {USECASE_MAX} characters, got {len(value)}"


# Each key: (required, (check, normalize)).
SCHEMAS = {
    "category": {
        "name": (True, plain(_name)), "title": (True, plain()), "description": (True, plain(_description)),
        "order": (True, (_order, int)),
    },
    "tool": {
        "name": (True, plain(_name)), "title": (True, plain()), "description": (True, plain(_description)),
        "order": (True, (_order, int)), "images": (True, plain_list(1, len(REGISTRIES), _images)),
        "upstream": (False, plain(_upstream)), "keywords": (False, plain_list(3, 8)),
    },
    "platform": {
        "name": (True, plain(_platform_name)), "description": (True, plain(_description)),
        "usecase": (True, plain(_usecase)), "keywords": (False, plain_list(2, 6)),
    },
}


def validate_frontmatter(data: dict | None, kind: str, slug: str) -> tuple[dict, list[str]]:
    if data is None:
        return {}, ["missing YAML frontmatter"]
    schema = SCHEMAS[kind]
    problems = [f'unknown frontmatter key "{key}"; allowed: {", ".join(schema)}' for key in data if key not in schema]
    meta = {}
    for key, (required, (check, normalize)) in schema.items():
        if key not in data:
            if required:
                problems.append(f'missing required key "{key}"')
            continue
        if problem := check(data[key], slug):
            problems.append(f"{key}: {problem}")
        else:
            meta[key] = normalize(data[key])
    return meta, problems


def tools_section_problems(body: str, expected: list[str], ordered: bool = True) -> list[str]:
    """Only bullets and blank lines; each bullet links one tool; every tool once, in order.

    Without a valid order on every tool (`ordered` false), only the set of links is checked,
    so one bad `order` is not reported twice.
    """
    lines = re.split(r"\r?\n", body)
    heading = f"## {TOOLS_SECTION}"
    start = next((index for index, line in enumerate(lines) if line.rstrip() == heading), None)
    if start is None:
        return [f'needs a "{heading}" section listing its tools']
    problems, linked = [], []
    for line in lines[start + 1:]:
        if re.match(r"#{1,2} ", line):
            break
        if not line.strip():
            continue
        match = TOOL_BULLET.fullmatch(line)
        if not match or NOT_PROSE.search(match.group(2)):
            problems.append(f'{heading}: "{line.strip()}" is not a "- [Title](./<tool>/) — description" bullet with prose only')
        else:
            linked.append(match.group(1))
    if (linked if ordered else sorted(linked)) != (expected if ordered else sorted(expected)):
        problems.append(f"{heading} must link each tool once, in order: expected {', '.join(expected) or 'none'}, "
                        f"got {', '.join(linked) or 'none'}")
    return problems


def check_documents(documents: dict[str, str]) -> list[tuple[str, str]]:
    """Every (path, problem) in the root, category, tool, and platform READMEs, keyed by repository path."""
    problems: list[tuple[str, str]] = []

    def report(path: str, found: list[str]) -> None:
        problems.extend((path, problem) for problem in found)

    def load(path: str, kind: str, slug: str) -> dict:
        data, body, parse_error = split_frontmatter(documents[path])
        if parse_error:
            report(path, [parse_error])
            return {"source": path, "body": body, "meta": {}}
        meta, found = validate_frontmatter(data, kind, slug)
        report(path, found)
        return {"source": path, "body": body, "meta": meta}

    paths = sorted(documents)
    categories: dict[str, dict] = {}
    for path in paths:
        if match := CATEGORY_README.fullmatch(path):
            categories[match[1]] = {"slug": match[1], **load(path, "category", match[1]), "tools": []}
    tools: dict[str, dict] = {}
    for path in paths:
        if not (match := TOOL_README.fullmatch(path)):
            continue
        category_slug, slug = match.groups()
        if category_slug not in categories:
            report(path, [f"tools need a category README at tools/{category_slug}/README.md"])
            categories[category_slug] = {"slug": category_slug, "source": None, "body": "", "meta": {}, "tools": []}
        tool = {"slug": slug, **load(path, "tool", slug), "platforms": []}
        categories[category_slug]["tools"].append(tool)
        tools[f"{category_slug}/{slug}"] = tool
    for path in paths:
        if not (match := PLATFORM_README.fullmatch(path)):
            continue
        category_slug, tool_slug, slug = match.groups()
        tool = tools.get(f"{category_slug}/{tool_slug}")
        if tool is None:
            report(path, [f"platform docs need a tool README at tools/{category_slug}/{tool_slug}/README.md"])
        elif slug not in PLATFORM_NAMES:
            report(path, [f"docs/{slug}/ is not a known platform; expected one of {', '.join(PLATFORM_NAMES)}"])
        else:
            tool["platforms"].append({"slug": slug, **load(path, "platform", slug)})

    if "README.md" in documents:
        if split_frontmatter(documents["README.md"])[0] is not None:
            report("README.md", ["the root README must not have frontmatter"])
    else:
        report("README.md", ["the root README is not tracked"])

    # Invalid documents have no order and sort last, by name.
    def by_order(doc: dict) -> tuple[float, str]:
        return (doc["meta"].get("order", math.inf), doc["slug"])

    ordered = sorted(categories.values(), key=by_order)
    rank = list(PLATFORM_NAMES)
    for category in ordered:
        category["tools"].sort(key=by_order)
        for tool in category["tools"]:
            tool["platforms"].sort(key=lambda platform: rank.index(platform["slug"]))
    tool_list = [tool for category in ordered for tool in category["tools"]]
    platforms = [platform for tool in tool_list for platform in tool["platforms"]]
    documented = [category for category in ordered if category["source"]]

    for category in documented:
        slugs = [tool["slug"] for tool in category["tools"]]
        ordered_tools = all("order" in tool["meta"] for tool in category["tools"])
        report(category["source"], tools_section_problems(category["body"], slugs, ordered_tools))

    def unique(label: str, docs: list[dict], key: str, scope: str) -> None:
        seen: dict[str, str] = {}
        for doc in docs:
            if key not in doc["meta"]:
                continue
            value = str(doc["meta"][key]).lower()
            if value in seen:
                report(doc["source"], [f"{label} duplicates {seen[value]}; make it unique {scope}"])
            else:
                seen[value] = doc["source"]

    unique("description", documented + tool_list + platforms, "description", "across all documents")
    unique("order", documented, "order", "among categories")
    for category in ordered:
        unique("order", category["tools"], "order", f"within tools/{category['slug']}/")
    for tool in tool_list:
        unique("usecase", tool["platforms"], "usecase", "within the tool")
    return problems


# Build args that are set per variant or by CI rather than pinned to an upstream release.
UNPINNED_ARGS = {"DISTRO", "BASE_IMAGE", "OS_REFRESH"}


def check_pins(path: pathlib.Path, text: str) -> None:
    """Every ARG with a default is a pin Renovate must be able to update."""
    lines = text.splitlines()
    for index, line in enumerate(lines):
        match = re.match(r"ARG (\w+)=", line)
        if match and match.group(1) not in UNPINNED_ARGS and not lines[index - 1].startswith("# renovate: "):
            error(f"{path}: ARG {match.group(1)} needs a '# renovate:' comment on the line above")
        elif "@sha256:" in line and not match:
            error(f"{path}: pin image digests in an ARG default, not inline: {line.strip()}")


# --- files -------------------------------------------------------------------

def check_files(all_files: list[pathlib.Path]) -> None:
    for path in all_files:
        posix = path.as_posix()
        must_execute = (
            (posix.startswith(".github/scripts/") and path.suffix == ".sh")
            or (posix.startswith("tools/") and path.suffix == ".sh" and {"docs", "tests"} & set(path.parts))
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


def strip_jsonc(text: str) -> str:
    """Drop // and /* */ comments outside strings; devcontainer.json is JSON with comments."""
    out, index, length = [], 0, len(text)
    while index < length:
        char = text[index]
        if char == '"':
            end = index + 1
            while end < length and text[end] != '"':
                end += 2 if text[end] == "\\" else 1
            out.append(text[index:end + 1])
            index = end + 1
        elif text.startswith("//", index):
            index = text.find("\n", index)
            index = length if index < 0 else index
        elif text.startswith("/*", index):
            end = text.find("*/", index + 2)
            if end < 0:
                raise ValueError("unterminated /* comment")
            index = end + 2
        else:
            out.append(char)
            index += 1
    return "".join(out)


def check_platform_files(all_files: list[pathlib.Path]) -> None:
    def in_platform(path: pathlib.Path, platform: str) -> bool:
        return path.parts[0] == "tools" and len(path.parts) > 2 and path.parts[-2] == platform and path.parts[-3] == "docs"

    workflows = [p for p in all_files if in_platform(p, "github-actions") and p.suffix in {".yml", ".yaml"}]
    check_workflow_hardening(workflows)
    if workflows and shutil.which("actionlint"):
        result = subprocess.run(["actionlint", *map(str, workflows)], capture_output=True, text=True)
        if result.returncode:
            error(f"actionlint failed:\n{(result.stdout + result.stderr).strip()}")
    elif workflows:
        notice("actionlint unavailable; skipped docs/github-actions lint")
    for path in (p for p in all_files if in_platform(p, "gitlab-ci") and p.suffix in {".yml", ".yaml"}):
        try:
            document = yaml.safe_load(path.read_text())
        except yaml.YAMLError as exc:
            error(f"{path}: invalid YAML: {exc}")
            continue
        if not isinstance(document, dict):
            error(f"{path}: GitLab CI configuration must be a mapping")
            continue
        for job_id, job in document.items():
            if isinstance(job, dict) and isinstance(job.get("script"), list):
                script = "\n".join(map(str, job["script"]))
                result = subprocess.run(["bash", "-n"], input=script, text=True, capture_output=True)
                if result.returncode:
                    error(f"{path}: job {job_id}: shell syntax error: {result.stderr.strip()}")
    for path in (p for p in all_files if in_platform(p, "devcontainer") and p.suffix == ".json"):
        try:
            document = json.loads(strip_jsonc(path.read_text()))
        except ValueError as exc:
            error(f"{path}: invalid JSONC: {exc}")
            continue
        if not isinstance(document, dict) or not document.get("image"):
            error(f"{path}: devcontainer.json must set image")


def run_suites() -> None:
    for command in (
        ["bash", ".agents/skills/maintain-agent-workspace/scripts/check-agent-workspace.sh"],
        ["bash", ".agents/skills/maintain-agent-workspace/scripts/test-check-agent-workspace.sh"],
        [sys.executable, "-B", ".github/scripts/test_validate_pr_metadata.py"],
        [sys.executable, "-B", ".github/scripts/test_check_repo.py"],
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
    check_files(all_files)
    check_renders(all_files)
    check_platform_files(all_files)
    for message in errors:
        print(f"error: {message}", file=sys.stderr)
    if errors:
        return 1
    print("Static repository checks passed (no image build or pull performed).")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
