"""Prepare a Docker Hub README with repository-relative links made absolute."""

from __future__ import annotations

import argparse
import re
import sys
from pathlib import Path, PurePosixPath
from urllib.parse import quote, urlsplit

from ci import write_actions
from image_common import bake_targets

REPOSITORY = "https://github.com/hambn/tool-containers"
RAW = "https://raw.githubusercontent.com/hambn/tool-containers/main"
FRONTMATTER = re.compile(r"\A---\r?\n.*?\r?\n---[ \t]*(?:\r?\n|\Z)\r?\n?", re.S)
LINK = re.compile(r"(!?\[[^\]\n]*\])\(([^)\s]+)\)")
FENCE = re.compile(r"^\s{0,3}(`{3,}|~{3,})")


def rewrite(readme: Path, text: str, *, root: Path | None = None) -> str:
    root = (root or Path.cwd()).resolve()
    relative = readme.resolve().relative_to(root)

    def absolute(match: re.Match[str]) -> str:
        target = match[2]
        if urlsplit(target).scheme or target.startswith(("#", "//")):
            return match[0]
        parsed = urlsplit(target)
        resolved = (root / relative.parent / parsed.path).resolve()
        path = PurePosixPath(resolved.relative_to(root).as_posix())
        if match[1].startswith("!"):
            url = f"{RAW}/{quote(str(path))}"
        else:
            kind = "tree" if resolved.is_dir() else "blob"
            url = f"{REPOSITORY}/{kind}/main/{quote(str(path))}"
        if parsed.query:
            url += "?" + parsed.query
        if parsed.fragment:
            url += "#" + parsed.fragment
        return f"{match[1]}({url})"

    lines = []
    fence = ""
    for line in FRONTMATTER.sub("", text, count=1).splitlines(keepends=True):
        match = FENCE.match(line)
        if match:
            marker = match[1]
            if not fence:
                fence = marker
            elif (
                marker[0] == fence[0]
                and len(marker) >= len(fence)
                and not line[match.end() :].strip()
            ):
                fence = ""
            lines.append(line)
        else:
            lines.append(line if fence else LINK.sub(absolute, line))
    return "".join(lines)


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("readme", type=Path)
    parser.add_argument("--output", type=Path)
    parser.add_argument(
        "--actions", action="store_true", help="Write the tool description to GITHUB_OUTPUT"
    )
    args = parser.parse_args()
    text = rewrite(args.readme, args.readme.read_text(encoding="utf-8"))
    if args.output:
        args.output.write_text(text, encoding="utf-8")
    else:
        sys.stdout.write(text)
    if args.actions:
        targets = bake_targets(args.readme.parent)
        description = next(iter(targets.values()))["labels"]["org.opencontainers.image.description"]
        write_actions("GITHUB_OUTPUT", {"description": description[:100]})
