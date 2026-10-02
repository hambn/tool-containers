"""Process execution and GitHub Actions file commands shared by CI scripts."""

from __future__ import annotations

import hashlib
import os
import subprocess
import sys
import tempfile
import urllib.request
import uuid
from collections.abc import Callable, Mapping, Sequence
from pathlib import Path


def required(name: str) -> str:
    value = os.environ.get(name, "")
    if not value:
        raise ValueError(f"{name} is required")
    return value


def boolean(name: str) -> bool:
    value = os.environ.get(name, "false").lower()
    if value not in {"true", "false"}:
        raise ValueError(f"{name} must be true or false")
    return value == "true"


def run(
    command: Sequence[str | Path],
    *,
    cwd: Path | None = None,
    env: Mapping[str, str] | None = None,
    capture: bool = False,
    check: bool = True,
) -> subprocess.CompletedProcess[str]:
    result = subprocess.run(
        list(map(str, command)),
        cwd=cwd,
        env=env,
        text=True,
        capture_output=capture,
        check=False,
    )
    if check and result.returncode:
        detail = (result.stderr or result.stdout or "").strip()
        raise RuntimeError(
            f"{command[0]} exited with {result.returncode}" + (f": {detail}" if detail else "")
        )
    return result


def output(command: Sequence[str | Path], *, cwd: Path | None = None) -> str:
    return run(command, cwd=cwd, capture=True).stdout.strip()


def write_actions(name: str, values: Mapping[str, str]) -> None:
    # Unique delimiters keep multiline JSON and descriptions out of file-command syntax.
    with Path(required(name)).open("a", encoding="utf-8") as stream:
        for key, value in values.items():
            delimiter = f"ci_{uuid.uuid4().hex}"
            stream.write(f"{key}<<{delimiter}\n{value}\n{delimiter}\n")


def summary(text: str) -> None:
    with Path(required("GITHUB_STEP_SUMMARY")).open("a", encoding="utf-8") as stream:
        stream.write(text + "\n")


def annotation(level: str, message: str) -> None:
    escaped = message.replace("%", "%25").replace("\r", "%0D").replace("\n", "%0A")
    print(f"::{level}::{escaped}", flush=True)


def download_verified(url: str, destination: Path, checksum: str) -> None:
    destination.parent.mkdir(parents=True, exist_ok=True)
    digest = hashlib.sha256()
    # Verify before replacing an executable that another step might already be using.
    with tempfile.NamedTemporaryFile(dir=destination.parent, delete=False) as stream:
        temporary = Path(stream.name)
        try:
            with urllib.request.urlopen(url, timeout=60) as response:
                while chunk := response.read(1024 * 1024):
                    digest.update(chunk)
                    stream.write(chunk)
            stream.close()
            if digest.hexdigest() != checksum:
                raise ValueError(f"SHA256 mismatch for {url}")
            temporary.replace(destination)
        finally:
            temporary.unlink(missing_ok=True)


def entrypoint(main: Callable[[], int | None]) -> None:
    try:
        status = main()
    except (OSError, RuntimeError, ValueError) as exc:
        annotation("error", str(exc))
        status = 1
    sys.exit(status or 0)
