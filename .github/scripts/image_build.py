#!/usr/bin/env python3
"""Build a selected image graph on a CI runner and smoke-test each result."""

import argparse
import json
import os
from pathlib import Path
import subprocess
import tempfile


ROOT = Path(__file__).resolve().parents[2]


def run(*args):
    subprocess.run(args, cwd=ROOT, check=True)


def output(*args):
    return subprocess.check_output(args, cwd=ROOT, text=True).strip()


def digest(ref):
    value = output("docker", "buildx", "imagetools", "inspect", ref,
                   "--format", "{{.Manifest.Digest}}")
    if not value.startswith("sha256:"):
        raise ValueError(f"invalid digest for {ref}: {value}")
    return value


def smoke(image, ref):
    profile = image["smoke"]
    launcher = {
        "codex": "codex --version",
        "claude-code": "claude --version",
        "open-code-review": "ocr --help",
        "pi-agent": "pi --version",
        "omnigent": "omnigent --help",
        "t3code": "t3 --help; codex --version; claude --version",
    }
    checks = {
        "minimal": "test \"$(id -u)\" = 1000; command -v curl; test -w \"$HOME\"",
        "core": "test \"$(id -u)\" = 1000; for cmd in bash git python3 node npm uv; do command -v \"$cmd\"; done; test -w /workspace",
        "full": "test \"$(id -u)\" = 1000; for cmd in bash zsh git node go kubectl docker; do command -v \"$cmd\"; done; test -r \"$HOME/.zshrc\"",
        "agent": f"test \"$(id -u)\" = 1000; {launcher.get(image['product'], 'false')}",
        "bundle": "test \"$(id -u)\" = 1000; for cmd in codex claude cursor-agent grok opencode copilot gemini pi acp-agent; do command -v \"$cmd\"; done; codex --version; claude --version; pi --version",
        "browser": "test \"$(id -u)\" = 1000; test -x \"$BROWSER_BIN\"; \"$BROWSER_BIN\" --version; timeout 30s \"$BROWSER_BIN\" --no-sandbox --disable-gpu --disable-dev-shm-usage --dump-dom about:blank >/dev/null",
    }
    if profile == "browser":
        checks["browser"] += ("; codex --version" if image["product"] == "agentbloat"
                              else "; t3 --help")
    subprocess.run(["docker", "run", "--rm", "--entrypoint", "/bin/sh", ref,
                    "-ec", checks[profile]], cwd=ROOT, check=True, timeout=90)


def build(plan):
    owner = plan["owner"]
    published = plan["mode"] == "publish"
    by_id = {image["id"]: image for image in plan["images"]}
    built = {}
    records = {}
    for image in plan["images"]:
        if not image["selected"]:
            continue
        image_ref = (f"ghcr.io/{owner}/{image['product']}:{image['build_tag']}" if published
                     else f"local/{image['id']}:pr")
        args = ["docker", "buildx", "build", "--file", image["dockerfile"],
                "--platform", "linux/amd64", "--tag", image_ref]
        cache_ref = f"ghcr.io/{owner}/buildcache:{image['id']}"
        args += ["--cache-from", f"type=registry,ref={cache_ref}"]
        if published:
            args += ["--pull", "--push", "--provenance=mode=max", "--sbom=true"]
        else:
            args += ["--load"]

        parent_refs = []
        for dep in image["deps"]:
            parent = by_id[dep]
            ref = built.get(dep) or f"ghcr.io/{owner}/{parent['product']}:{parent['tag']}"
            if published and dep not in built:
                ref = f"{ref}@{digest(ref)}"
            parent_refs.append(ref)
        if parent_refs:
            args += ["--build-arg", f"BASE_IMAGE={parent_refs[0]}"]
        if len(parent_refs) > 1:
            args += ["--build-arg", f"AGENT_BUNDLE_IMAGE={parent_refs[1]}"]
        for name, value in image["resolved_bases"].items():
            args += ["--build-arg", f"{name}={value}"]
        for name, value in image["resolved_versions"].items():
            args += ["--build-arg", f"{name}={value}"]
        if published and image.get("refresh_week"):
            args += ["--build-arg", f"REFRESH_WEEK={image['refresh_week']}"]
        if published:
            labels = {
                "org.opencontainers.image.source": f"https://github.com/{owner}/tool-containers",
                "org.opencontainers.image.revision": os.environ["GITHUB_SHA"],
                "org.opencontainers.image.version": image["build_tag"],
                "org.opencontainers.image.documentation": f"https://github.com/{owner}/tool-containers/blob/main/tools/{'ai' if image['product'] not in {'runtime', 'workspace'} else ('base' if image['product'] == 'runtime' else 'dev')}/{image['product']}/README.md",
                "io.tool-containers.profile": image["tag"],
                "io.tool-containers.inputs-sha256": image["fingerprint"],
                "io.tool-containers.versions": json.dumps(image["resolved_versions"], sort_keys=True),
                "io.tool-containers.external-bases": json.dumps(image["resolved_bases"], sort_keys=True),
            }
            if parent_refs:
                labels["org.opencontainers.image.base.name"] = parent_refs[0]
                labels["org.opencontainers.image.base.digest"] = parent_refs[0].rsplit("@", 1)[-1]
            elif image["resolved_bases"].get("RUNTIME_BASE"):
                labels["org.opencontainers.image.base.name"] = image["resolved_bases"]["RUNTIME_BASE"]
                labels["org.opencontainers.image.base.digest"] = image["resolved_bases"]["RUNTIME_BASE"].rsplit("@", 1)[-1]
            if len(parent_refs) > 1:
                labels["io.tool-containers.agent-bundle.digest"] = parent_refs[1].rsplit("@", 1)[-1]
            for key, value in labels.items():
                args += ["--label", f"{key}={value}"]
            args += ["--cache-to", f"type=registry,ref={cache_ref},mode=max"]
        with tempfile.NamedTemporaryFile(prefix="image-metadata-", suffix=".json") as metadata:
            args += ["--metadata-file", metadata.name, image["context"]]
            run(*args)
            if published:
                data = json.loads(Path(metadata.name).read_text())
                image_digest = data["containerimage.digest"]
                built[image["id"]] = f"ghcr.io/{owner}/{image['product']}@{image_digest}"
                records[image["id"]] = {"ref": image_ref, "digest": image_digest,
                                         "product": image["product"], "tag": image["tag"],
                                         "build_tag": image["build_tag"]}
            else:
                built[image["id"]] = image_ref
        smoke(image, image_ref)
    return records


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--plan", required=True)
    parser.add_argument("--output", required=True)
    args = parser.parse_args()
    plan = json.loads(Path(args.plan).read_text())
    Path(args.output).write_text(json.dumps(build(plan), indent=2) + "\n")


if __name__ == "__main__":
    main()
