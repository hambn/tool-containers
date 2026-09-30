"""Install verified lint binaries and check the repository's tracked source files."""

from __future__ import annotations

import argparse
import sys
import tarfile
from pathlib import Path

from ci import download_verified, entrypoint, output, required, run

# Keep release URLs and checksums together; a version bump needs both.
DOWNLOADS = {
    "actionlint": (
        "https://github.com/rhysd/actionlint/releases/download/v1.7.12/actionlint_1.7.12_linux_amd64.tar.gz",
        "8aca8db96f1b94770f1b0d72b6dddcb1ebb8123cb3712530b08cc387b349a3d8",
        "actionlint",
    ),
    "hadolint": (
        "https://github.com/hadolint/hadolint/releases/download/v2.15.1/hadolint-linux-x86_64",
        "c7187db94eeeeca956519a6af171adc31453941a1e777961f6e680f697c8c507",
        "",
    ),
    "shellcheck": (
        "https://github.com/koalaman/shellcheck/releases/download/v0.11.0/shellcheck-v0.11.0.linux.x86_64.tar.gz",
        "b7af85e41cc99489dcc21d66c6d5f3685138f06d34651e6d34b42ec6d54fe6f6",
        "shellcheck-v0.11.0/shellcheck",
    ),
    "shfmt": (
        "https://github.com/mvdan/sh/releases/download/v3.14.1/shfmt_v3.14.1_linux_amd64",
        "76e77641faa025814b77f153b29796b8e6fa2fca03e0c76a691608b86c7ea7bf",
        "",
    ),
}
# BASE_IMAGE is a build arg; rootfs overlays intentionally copy /. Temporary stages
# may end as root, and OS package versions are refreshed through OS_REFRESH.
HADOLINT_IGNORES = ("DL3002", "DL3006", "DL3008", "DL3018", "DL3066", "DL3067")


def install() -> None:
    directory = Path(required("RUNNER_TEMP")) / "lint"
    binaries = directory / "bin"
    binaries.mkdir(parents=True, exist_ok=True)
    for name, (url, checksum, member) in DOWNLOADS.items():
        downloaded = directory / name if member else binaries / name
        download_verified(url, downloaded, checksum)
        if member:
            with tarfile.open(downloaded) as archive:
                info = archive.getmember(member)
                if not info.isfile():
                    raise ValueError(f"{name}: expected a regular executable in the archive")
                stream = archive.extractfile(info)
                if stream is None:
                    raise ValueError(f"{name}: archive member cannot be read")
                with stream:
                    (binaries / name).write_bytes(stream.read())
        (binaries / name).chmod(0o755)
    run(
        [
            sys.executable,
            "-m",
            "pip",
            "install",
            "--disable-pip-version-check",
            "--no-cache-dir",
            "--target",
            directory / "python",
            "-r",
            ".github/requirements-lint.txt",
        ]
    )
    with Path(required("GITHUB_PATH")).open("a", encoding="utf-8") as stream:
        stream.write(str(binaries) + "\n" + str(directory / "python/bin") + "\n")


def tracked(pattern: str) -> list[str]:
    return [name for name in output(["git", "ls-files", "-z", pattern]).split("\0") if name]


def lint(name: str) -> None:
    if name == "python":
        run(["ruff", "check", "--no-cache", "--config", ".github/ruff.toml", ".github/scripts"])
        run(
            [
                "ruff",
                "format",
                "--check",
                "--no-cache",
                "--config",
                ".github/ruff.toml",
                ".github/scripts",
            ]
        )
        return
    if name == "actionlint":
        run(["actionlint", "-color"])
        files = tracked("tools/*/*/docs/github-actions/*.yml")
        options = ["-color"]
    elif name == "hadolint":
        files = tracked("tools/**/Dockerfile")
        options = [argument for rule in HADOLINT_IGNORES for argument in ("--ignore", rule)]
    else:
        files = tracked("*.sh")
        options = ["-d", "-i", "4"] if name == "shfmt" else []
    # Invoke once per file to avoid ARG_MAX on growing catalogs and report the exact file.
    for path in files:
        run([name, *options, path])


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("phase", choices=("install", "python", *DOWNLOADS))
    args = parser.parse_args()
    if args.phase == "install":
        install()
    else:
        lint(args.phase)


if __name__ == "__main__":
    entrypoint(main)
