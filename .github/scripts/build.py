"""Build, test, scan, and export one variant on its native architecture."""

from __future__ import annotations

import argparse
import json
import os
from datetime import UTC, datetime
from pathlib import Path
from typing import Any

from ci import boolean, download_verified, entrypoint, output, required, run
from image_common import (
    ARCHITECTURES,
    BASE_DIGEST_LABEL,
    LAYER_EXPORT,
    OS_REFRESH_LABEL,
    SOURCE_DATE_EPOCH,
    bake_targets,
    cache_imports,
    cache_reference,
    digest,
    dockerfile_arg,
    identifier,
    inspect,
    pinned,
    platform_manifests,
)

CST_VERSION = "1.22.1"
CST_CHECKSUMS = {
    "amd64": "fa35e89512a8978585f76cf41397956d2e3a30c62c2ad3fb857b1597074d14ca",
    "arm64": "801826ed107222120eb6df8c143b7de752cfebbe3aebfeea576e7098486917c2",
}


def build_environment() -> dict[str, str]:
    return {**os.environ, "SOURCE_DATE_EPOCH": SOURCE_DATE_EPOCH}


def bake_options(
    tool: Path, target: str, arch: str, cache: str, targets: dict[str, Any]
) -> list[str]:
    if arch not in ARCHITECTURES:
        raise ValueError(f"Unsupported architecture: {arch}")
    imports = cache_imports(cache, tool, target, arch, targets)
    return [
        f"{target}.platform=linux/{arch}",
        f"{target}.args.SOURCE_DATE_EPOCH={SOURCE_DATE_EPOCH}",
        f"{target}.cache-from={imports[0]}",
        *(f"{target}.cache-from+={item}" for item in imports[1:]),
    ]


def bake_command(
    target: str, options: list[str], temporary: Path, *, attest: bool = False
) -> list[str]:
    return [
        "docker",
        "buildx",
        "bake",
        target,
        "--progress=plain",
        f"--allow=fs={temporary}",
        "--provenance=mode=max" if attest else "--provenance=false",
        *(["--sbom=true"] if attest else []),
        *(f"--set={item}" for item in options),
    ]


class Builder:
    def __init__(self) -> None:
        self.root = Path(required("GITHUB_WORKSPACE"))
        self.tool = self.root / required("TOOL")
        self.temporary = Path(required("RUNNER_TEMP"))
        self.target = identifier(required("TARGET"))
        self.arch = required("ARCH")
        self.image = identifier(required("IMAGE"))
        self.variant = identifier(required("VARIANT"))
        self.cache = required("CACHE")
        self.state_path = self.temporary / "build-options.json"
        self.local_image = f"local/{self.image}:test"

    def save(self, state: dict[str, Any]) -> None:
        self.state_path.write_text(json.dumps(state, indent=2) + "\n", encoding="utf-8")

    def state(self) -> dict[str, Any]:
        return json.loads(self.state_path.read_text(encoding="utf-8"))

    def execute(
        self,
        options: list[str],
        *,
        tool: Path | None = None,
        target: str | None = None,
        attest: bool = False,
        metadata: Path | None = None,
    ) -> None:
        command = bake_command(target or self.target, options, self.temporary, attest=attest)
        if metadata:
            command.append(f"--metadata-file={metadata}")
        run(command, cwd=tool or self.tool, env=build_environment())

    def parents(self) -> None:
        context = ""
        for index, parent in enumerate(json.loads(os.environ.get("PARENTS", "[]"))):
            tool = self.root / parent["dir"]
            target = parent["target"]
            targets = bake_targets(tool)
            options = bake_options(tool, target, self.arch, self.cache, targets)
            destination = self.temporary / f"parent-{index}"
            options.append(f"{target}.output=type=oci,dest={destination},tar=false,{LAYER_EXPORT}")
            if context:
                options += [
                    f"{target}.args.BASE_IMAGE=parent",
                    f"{target}.contexts.parent={context}",
                ]
            elif parent.get("base"):
                options.append(f"{target}.args.BASE_IMAGE={parent['base']}")
            self.execute(options, tool=tool, target=target)
            manifest = json.loads((destination / "index.json").read_text(encoding="utf-8"))
            context = f"oci-layout://{destination}@{digest(manifest['manifests'][0]['digest'])}"
        (self.temporary / "parent-context.txt").write_text(context, encoding="utf-8")

    def prepare(self) -> None:
        targets = bake_targets(self.tool)
        options = bake_options(self.tool, self.target, self.arch, self.cache, targets)
        parent_file = self.temporary / "parent-context.txt"
        context = parent_file.read_text(encoding="utf-8") if parent_file.exists() else ""
        base = os.environ.get("BASE", "")
        if context:
            options += [
                f"{self.target}.args.BASE_IMAGE=parent",
                f"{self.target}.contexts.parent={context}",
            ]
        elif base:
            options.append(f"{self.target}.args.BASE_IMAGE={base}")
        refresh = os.environ.get("OS_REFRESH", "") or dockerfile_arg(self.tool, "OS_REFRESH")
        if refresh:
            options.append(f"{self.target}.args.OS_REFRESH={refresh}")
        committed = int(output(["git", "log", "-1", "--format=%ct", "--", "."], cwd=self.tool))
        labels = {
            BASE_DIGEST_LABEL: (base or context).partition("@")[2],
            OS_REFRESH_LABEL: refresh,
            "org.opencontainers.image.version": required("VERSION"),
            "org.opencontainers.image.revision": required("GITHUB_SHA"),
            "org.opencontainers.image.created": datetime.fromtimestamp(committed, UTC).strftime(
                "%Y-%m-%dT%H:%M:%SZ"
            ),
            "org.opencontainers.image.source": f"https://github.com/{required('GITHUB_REPOSITORY')}",
            "org.opencontainers.image.url": "https://tool-containers.hgh.dev",
            "org.opencontainers.image.licenses": "MIT",
            "org.opencontainers.image.vendor": "hambn",
        }
        options.extend(f"{self.target}.labels.{name}={value}" for name, value in labels.items())
        self.save({"options": options, "passed": []})

    def build(self) -> None:
        state = self.state()
        self.execute(
            state["options"]
            + [
                f"{self.target}.tags={self.local_image}",
                f"{self.target}.output=type=docker,{LAYER_EXPORT}",
            ]
        )
        image = json.loads(output(["docker", "image", "inspect", self.local_image]))[0]
        if image["Architecture"] != self.arch:
            raise ValueError(f"Built {image['Architecture']}, expected {self.arch}")
        state.update(layers=image["RootFS"]["Layers"], passed=[])
        self.save(state)

    def start_check(self, check: str) -> None:
        state = self.state()
        if "layers" not in state:
            raise ValueError("Build the test image before running its checks")
        state["passed"] = [name for name in state["passed"] if name != check]
        self.save(state)

    def passed(self, check: str) -> None:
        state = self.state()
        if "layers" not in state:
            raise ValueError("Build the test image before running its checks")
        state["passed"] = sorted(set(state["passed"]) | {check})
        self.save(state)

    def structure(self) -> None:
        self.start_check("structure")
        binary = self.temporary / "cst"
        download_verified(
            f"https://github.com/GoogleContainerTools/container-structure-test/releases/download/v{CST_VERSION}/container-structure-test-linux-{self.arch}",
            binary,
            CST_CHECKSUMS[self.arch],
        )
        binary.chmod(0o755)
        configs = [self.tool / "tests/structure.yaml"]
        for name in dict.fromkeys([required("DISTRO"), required("TIER"), self.variant]):
            candidate = self.tool / f"tests/structure-{identifier(name)}.yaml"
            if candidate.is_file():
                configs.append(candidate)
        run(
            [
                binary,
                "test",
                "--image",
                self.local_image,
                *(argument for config in configs for argument in ["--config", config]),
            ],
            cwd=self.tool,
        )
        self.passed("structure")

    def smoke(self) -> None:
        self.start_check("smoke")
        script = self.tool / "tests/smoke.sh"
        if script.is_file():
            run([script, self.local_image], cwd=self.tool)
        self.passed("smoke")

    def scan(self) -> None:
        self.start_check("scan")
        prefix = ["trivy", "image", "--quiet", "--ignorefile", self.root / "tools/trivyignore.yaml"]
        run(
            [
                *prefix,
                "--scanners",
                "vuln",
                "--format",
                "sarif",
                "--output",
                self.root / "trivy.sarif",
                self.local_image,
            ]
        )
        run(
            [
                *prefix,
                "--scanners",
                "vuln",
                "--pkg-types",
                "os",
                "--severity",
                "HIGH,CRITICAL",
                "--ignore-unfixed",
                "--exit-code",
                "1",
                self.local_image,
            ]
        )
        run(
            [
                *prefix,
                "--scanners",
                "secret",
                "--exit-code",
                "1",
                "--skip-dirs",
                "/usr/local/lib/node_modules",
                "--skip-dirs",
                "/usr/local/go",
                "--skip-dirs",
                "/opt",
                self.local_image,
            ]
        )
        self.passed("scan")

    def push(self) -> None:
        if (
            not boolean("PUBLISH")
            or os.environ.get("GITHUB_REF") != "refs/heads/main"
            or os.environ.get("GITHUB_EVENT_NAME") == "pull_request"
        ):
            raise ValueError(
                "Image and cache exports are allowed only on main outside pull requests"
            )
        state = self.state()
        if set(state["passed"]) != {"structure", "smoke", "scan"}:
            raise ValueError("Structure, smoke, and scan checks must pass before export")
        cache = cache_reference(self.cache, self.image, self.variant, self.arch)
        reference = f"{required('GHCR')}/{self.image}"
        metadata = self.temporary / "metadata.json"
        # Test and push use the saved inputs. Only exporter/attestation settings differ.
        self.execute(
            state["options"]
            + [
                f"{self.target}.cache-to=type=registry,ref={cache},mode=max,oci-mediatypes=true,image-manifest=true,compression=gzip,force-compression=false",
                f"{self.target}.tags=",
                f"{self.target}.output=type=image,name={reference},push-by-digest=true,name-canonical=true,push=true,{LAYER_EXPORT}",
            ],
            attest=True,
            metadata=metadata,
        )
        image_digest = digest(
            json.loads(metadata.read_text(encoding="utf-8"))[self.target]["containerimage.digest"]
        )
        manifest = inspect(pinned(reference, image_digest))
        runtime_digest = platform_manifests(manifest).get(self.arch, image_digest)
        image = inspect(pinned(reference, runtime_digest), "Image")
        if image["rootfs"]["diff_ids"] != state["layers"]:
            raise ValueError(
                "Exported layers differ from the tested image; refusing a publication artifact"
            )
        directory = self.temporary / "digests"
        directory.mkdir(exist_ok=True)
        (directory / f"{self.variant}-{self.arch}").write_text(
            image_digest + "\n", encoding="utf-8"
        )


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "phase", choices=("parents", "prepare", "build", "structure", "smoke", "scan", "push")
    )
    args = parser.parse_args()
    builder = Builder()
    getattr(builder, args.phase)()


if __name__ == "__main__":
    entrypoint(main)
