#!/usr/bin/env python3
"""Validate pull request titles and required body sections."""

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


def validate(title: str, body: str, actor: str) -> list[str]:
    """Return actionable validation errors for one pull request."""
    errors: list[str] = []
    if not TITLE_PATTERN.fullmatch(title):
        errors.append(
            "PR title must follow Conventional Commits, for example "
            "'fix(agentimg): preserve runtime ownership'."
        )

    if actor in BODY_EXEMPT_ACTORS:
        return errors

    headings = list(re.finditer(r"^##[ \t]+(.+?)[ \t]*$", body, re.MULTILINE))
    sections: dict[str, list[str]] = {name: [] for name in REQUIRED_SECTIONS}
    for index, match in enumerate(headings):
        name = match.group(1)
        if name not in sections:
            continue
        end = headings[index + 1].start() if index + 1 < len(headings) else len(body)
        sections[name].append(body[match.end() : end])

    missing = [f"## {name}" for name, values in sections.items() if not values]
    if missing:
        errors.append(f"PR body is missing required sections: {', '.join(missing)}")

    duplicates = [f"## {name}" for name, values in sections.items() if len(values) > 1]
    if duplicates:
        errors.append(f"PR body repeats required sections: {', '.join(duplicates)}")

    empty: list[str] = []
    for name, values in sections.items():
        if len(values) != 1:
            continue
        content = re.sub(r"<!--.*?-->", "", values[0], flags=re.DOTALL)
        meaningful = [
            line.strip()
            for line in content.splitlines()
            if line.strip()
            and not line.lstrip().startswith(("#", "- ["))
            and line.strip() != "-"
        ]
        if not meaningful:
            empty.append(f"## {name}")
    if empty:
        errors.append(
            f"PR body sections must contain meaningful details: {', '.join(empty)}"
        )

    return errors


def main() -> int:
    errors = validate(
        title=os.environ.get("PR_TITLE", ""),
        body=os.environ.get("PR_BODY", ""),
        actor=os.environ.get("ACTOR", ""),
    )
    for error in errors:
        print(error, file=sys.stderr)
    return bool(errors)


if __name__ == "__main__":
    raise SystemExit(main())
