#!/usr/bin/env python3
"""Print a README with relative Markdown links rewritten to absolute GitHub URLs.

Usage: hub-readme.py <path/to/README.md>  (run from the repository root)
"""

import pathlib
import posixpath
import re
import sys

REPOSITORY = "https://github.com/hambn/tool-containers"
RAW = "https://raw.githubusercontent.com/hambn/tool-containers/main"


def rewrite(readme: pathlib.Path, text: str) -> str:
    def absolute(match: re.Match) -> str:
        target = match.group(2)
        if re.match(r"^[a-z][a-z0-9+.-]*:|^#", target):
            return match.group(0)
        path, _, anchor = target.partition("#")
        resolved = posixpath.normpath(posixpath.join(readme.parent.as_posix(), path))
        if match.group(1).startswith("!"):
            url = f"{RAW}/{resolved}"
        else:
            kind = "tree" if pathlib.Path(resolved).is_dir() else "blob"
            url = f"{REPOSITORY}/{kind}/main/{resolved}" + (f"#{anchor}" if anchor else "")
        return f"{match.group(1)}({url})"

    return re.sub(r"(!?\[[^\]]*\])\(([^)\s]+)\)", absolute, text)


if __name__ == "__main__":
    path = pathlib.Path(sys.argv[1])
    sys.stdout.write(rewrite(path, path.read_text()))
