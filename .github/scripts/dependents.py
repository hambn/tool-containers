"""Request outdated-only builds after parent image publication."""

from __future__ import annotations

import re

from ci import entrypoint, required, run


def main() -> None:
    workflows = required("DEPENDENTS").split()
    for workflow in dict.fromkeys(workflows):
        if not re.fullmatch(r"[a-z0-9-]+\.yml", workflow):
            raise ValueError(f"Invalid dependent workflow: {workflow!r}")
        run(
            [
                "gh",
                "workflow",
                "run",
                workflow,
                "--repo",
                required("GITHUB_REPOSITORY"),
                "--ref",
                "main",
                "-f",
                "outdated-only=true",
            ]
        )


if __name__ == "__main__":
    entrypoint(main)
