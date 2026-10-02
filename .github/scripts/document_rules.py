"""Document metadata and catalog rules shared with the web UI fixture cases."""

from __future__ import annotations

import datetime
import math
import re
from collections.abc import Callable
from typing import Any

import yaml

FRONTMATTER = re.compile(r"---\r?\n(.*?)\r?\n---[ \t]*(?:\r?\n|\Z)", re.S)
CATEGORY_README = re.compile(r"tools/([^/]+)/README\.md")
TOOL_README = re.compile(r"tools/([^/]+)/([^/]+)/README\.md")
PLATFORM_README = re.compile(r"tools/([^/]+)/([^/]+)/docs/([^/]+)/README\.md")
PLATFORM_NAMES = {
    "docker": "Docker",
    "docker-compose": "Docker Compose",
    "podman": "Podman",
    "kubernetes": "Kubernetes",
    "helm": "Helm",
    "github-actions": "GitHub Actions",
    "gitlab-ci": "GitLab CI",
    "devcontainer": "Dev Container",
}
# CI/editor platform directories must include their runnable entry point.
PLATFORM_FILES = {
    "github-actions": "workflow.yml",
    "gitlab-ci": "gitlab-ci.yml",
    "devcontainer": "devcontainer.json",
}
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


def _construct_unique_mapping(
    loader: StrictLoader, node: yaml.MappingNode, deep: bool = False
) -> dict:
    seen = set()
    for key_node, _ in node.value:
        key = loader.construct_object(key_node, deep=deep)
        try:
            duplicate = key in seen
        except TypeError:
            continue
        if duplicate:
            raise yaml.constructor.ConstructorError(
                None, None, f"duplicate key {key!r}", key_node.start_mark
            )
        seen.add(key)
    return loader.construct_mapping(node, deep)


StrictLoader.add_constructor(
    yaml.resolver.BaseResolver.DEFAULT_MAPPING_TAG, _construct_unique_mapping
)


def type_name(value: object) -> str:
    if value is None:
        return "null"
    return {
        bool: "boolean",
        int: "integer",
        float: "float",
        str: "string",
        list: "list",
        dict: "mapping",
    }.get(
        type(value),
        "date" if isinstance(value, (datetime.date, datetime.datetime)) else type(value).__name__,
    )


def split_frontmatter(text: str) -> tuple[dict | None, str, str]:
    """Return (data, body, error); data is None without frontmatter."""
    match = FRONTMATTER.match(text)
    if not match:
        return None, text, ""
    body = text[match.end() :]
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


def plain(
    extra: Callable[[str, str], str] | None = None,
) -> tuple[Callable[[Any, str], str], Callable[[str], str]]:
    def check(value: Any, slug: str) -> str:
        return plain_problem(value) or (extra(value.strip(), slug) if extra else "")

    return check, str.strip


def plain_list(
    low: int, high: int, extra: Callable[[list[str], str], str] | None = None
) -> tuple[Callable[[Any, str], str], Callable[[list[str]], list[str]]]:
    def check(value: Any, slug: str) -> str:
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


def _name(value: str, slug: str) -> str:
    return "" if value == slug else f'must equal the directory name "{slug}", got "{value}"'


def _description(value: str, slug: str) -> str:
    low, high = DESCRIPTION_LENGTH
    return "" if low <= len(value) <= high else f"must be {low}-{high} characters, got {len(value)}"


def _order(value: Any, slug: str) -> str:
    return (
        ""
        if type(value) is int and value >= 1
        else f"must be an integer of at least 1, got {type_name(value)} {value}"
    )


def _images(value: list[str], slug: str) -> str:
    allowed = [f"{registry}{slug}" for registry in REGISTRIES]
    bad = next((image for image in value if image not in allowed), None)
    if bad:
        return f'"{bad}" is not one of {", ".join(allowed)}'
    return "" if value[0] == allowed[0] else f"must list {allowed[0]} first"


def _upstream(value: str, slug: str) -> str:
    return "" if HTTPS_URL.fullmatch(value) else f'must be an https URL, got "{value}"'


def _platform_name(value: str, slug: str) -> str:
    expected = PLATFORM_NAMES.get(slug)
    return "" if value == expected else f'must be "{expected}" for docs/{slug}/, got "{value}"'


def _usecase(value: str, slug: str) -> str:
    return (
        ""
        if len(value) <= USECASE_MAX
        else f"must be at most {USECASE_MAX} characters, got {len(value)}"
    )


# Each key: (required, (check, normalize)).
SCHEMAS = {
    "category": {
        "name": (True, plain(_name)),
        "title": (True, plain()),
        "description": (True, plain(_description)),
        "order": (True, (_order, int)),
    },
    "tool": {
        "name": (True, plain(_name)),
        "title": (True, plain()),
        "description": (True, plain(_description)),
        "order": (True, (_order, int)),
        "images": (True, plain_list(1, len(REGISTRIES), _images)),
        "upstream": (False, plain(_upstream)),
        "keywords": (False, plain_list(3, 8)),
    },
    "platform": {
        "name": (True, plain(_platform_name)),
        "description": (True, plain(_description)),
        "usecase": (True, plain(_usecase)),
        "keywords": (False, plain_list(2, 6)),
    },
}


def validate_frontmatter(data: dict | None, kind: str, slug: str) -> tuple[dict, list[str]]:
    if data is None:
        return {}, ["missing YAML frontmatter"]
    schema = SCHEMAS[kind]
    problems = [
        f'unknown frontmatter key "{key}"; allowed: {", ".join(schema)}'
        for key in data
        if key not in schema
    ]
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
    for line in lines[start + 1 :]:
        if re.match(r"#{1,2} ", line):
            break
        if not line.strip():
            continue
        match = TOOL_BULLET.fullmatch(line)
        if not match or NOT_PROSE.search(match.group(2)):
            problems.append(
                f'{heading}: "{line.strip()}" is not a "- [Title](./<tool>/) — description" bullet with prose only'
            )
        else:
            linked.append(match.group(1))
    if (linked if ordered else sorted(linked)) != (expected if ordered else sorted(expected)):
        problems.append(
            f"{heading} must link each tool once, in order: expected {', '.join(expected) or 'none'}, "
            f"got {', '.join(linked) or 'none'}"
        )
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
            categories[match[1]] = {
                "slug": match[1],
                **load(path, "category", match[1]),
                "tools": [],
            }
    tools: dict[str, dict] = {}
    for path in paths:
        if not (match := TOOL_README.fullmatch(path)):
            continue
        category_slug, slug = match.groups()
        if category_slug not in categories:
            report(path, [f"tools need a category README at tools/{category_slug}/README.md"])
            categories[category_slug] = {
                "slug": category_slug,
                "source": None,
                "body": "",
                "meta": {},
                "tools": [],
            }
        tool = {"slug": slug, **load(path, "tool", slug), "platforms": []}
        categories[category_slug]["tools"].append(tool)
        tools[f"{category_slug}/{slug}"] = tool
    for path in paths:
        if not (match := PLATFORM_README.fullmatch(path)):
            continue
        category_slug, tool_slug, slug = match.groups()
        tool = tools.get(f"{category_slug}/{tool_slug}")
        if tool is None:
            report(
                path,
                [
                    f"platform docs need a tool README at tools/{category_slug}/{tool_slug}/README.md"
                ],
            )
        elif slug not in PLATFORM_NAMES:
            report(
                path,
                [
                    f"docs/{slug}/ is not a known platform; expected one of {', '.join(PLATFORM_NAMES)}"
                ],
            )
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
