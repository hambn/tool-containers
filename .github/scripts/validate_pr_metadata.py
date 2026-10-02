#!/usr/bin/env python3
"""Validate Conventional Commit titles and meaningful pull request sections."""

from __future__ import annotations

import os
import re
import sys

TITLE_PATTERN = re.compile(
    r"^(build|chore|ci|docs|feat|fix|perf|refactor|revert|style|test)"
    r"(\([a-z0-9][a-z0-9._/-]*\))?!?: \S(?:.*\S)?$"
)
REQUIRED_SECTIONS = ("Summary", "Validation")
BODY_EXEMPT_ACTORS = {"dependabot[bot]"}
TASK_LIST_PLACEHOLDER = re.compile(r"^[-*+]\s+\[[ xX]\](?:\s|$)")
HEADING = re.compile(r"^##[ \t]+(.+?)[ \t]*$", re.MULTILINE)


def section_bodies(body: str) -> dict[str, list[str]]:
    headings = list(HEADING.finditer(body))
    sections: dict[str, list[str]] = {name: [] for name in REQUIRED_SECTIONS}
    for index, heading in enumerate(headings):
        if heading[1] in sections:
            end = headings[index + 1].start() if index + 1 < len(headings) else len(body)
            sections[heading[1]].append(body[heading.end() : end])
    return sections


def has_details(body: str) -> bool:
    content = re.sub(r"<!--.*?-->", "", body, flags=re.DOTALL)
    return any(
        line
        and not line.startswith("#")
        and not TASK_LIST_PLACEHOLDER.match(line)
        and line not in {"-", "*", "+"}
        for line in map(str.strip, content.splitlines())
    )


def validate(title: str, body: str, actor: str) -> list[str]:
    errors = []
    if not TITLE_PATTERN.fullmatch(title):
        errors.append(
            "PR title must follow Conventional Commits, for example "
            "'fix(agentimg): preserve runtime ownership'."
        )
    if actor in BODY_EXEMPT_ACTORS:
        return errors
    sections = section_bodies(body)
    missing = [f"## {name}" for name, values in sections.items() if not values]
    duplicate = [f"## {name}" for name, values in sections.items() if len(values) > 1]
    empty = [
        f"## {name}"
        for name, values in sections.items()
        if len(values) == 1 and not has_details(values[0])
    ]
    if missing:
        errors.append(f"PR body is missing required sections: {', '.join(missing)}")
    if duplicate:
        errors.append(f"PR body repeats required sections: {', '.join(duplicate)}")
    if empty:
        errors.append(f"PR body sections must contain meaningful details: {', '.join(empty)}")
    return errors


def main() -> int:
    errors = validate(
        os.environ.get("PR_TITLE", ""), os.environ.get("PR_BODY", ""), os.environ.get("ACTOR", "")
    )
    for error in errors:
        print(error, file=sys.stderr)
    return int(bool(errors))


if __name__ == "__main__":
    raise SystemExit(main())
