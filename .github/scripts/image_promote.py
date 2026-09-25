#!/usr/bin/env python3
"""Stage tested image digests in both registries before moving catalog tags."""

import argparse
import json
import os
from pathlib import Path
import re
import subprocess


def inspect(ref):
    result = subprocess.run(["docker", "buildx", "imagetools", "inspect", ref,
                             "--format", "{{.Manifest.Digest}}"],
                            text=True, capture_output=True)
    if result.returncode == 0:
        return result.stdout.strip()
    if re.search(r"manifest\s+unknown|MANIFEST_UNKNOWN|NAME_UNKNOWN|status code: 404|404 Not Found", result.stderr, re.I):
        return None
    raise RuntimeError(f"registry inspection failed for {ref}: {result.stderr.strip()}")


def create(target, source, expected=None):
    found = inspect(target)
    if found is not None:
        if expected and found != expected:
            raise RuntimeError(f"immutable build tag collision: {target}")
        if expected:
            return found
    subprocess.run(["docker", "buildx", "imagetools", "create", "--tag", target, source],
                   check=True)
    result = inspect(target)
    if not result:
        raise RuntimeError(f"missing promoted tag: {target}")
    return result


def copy_to_dockerhub(target, source, expected):
    found = inspect(target)
    if found is not None:
        if found != expected:
            raise RuntimeError(f"immutable build tag collision: {target}")
        return found
    subprocess.run(["skopeo", "copy", "--all", "--preserve-digests",
                    f"docker://{source}", f"docker://{target}"], check=True)
    found = inspect(target)
    if found != expected:
        raise RuntimeError(f"Docker Hub digest differs from tested content: {target}")
    return found


def promote(records, owner, hub_user):
    staged = {}
    for image_id, record in records.items():
        source = f"ghcr.io/{owner}/{record['product']}@{record['digest']}"
        ghcr_build = f"ghcr.io/{owner}/{record['product']}:{record['build_tag']}"
        if inspect(ghcr_build) != record["digest"]:
            raise RuntimeError(f"unverified GHCR build tag: {ghcr_build}")
        hub_build = f"docker.io/{hub_user}/{record['product']}:{record['build_tag']}"
        hub_digest = copy_to_dockerhub(hub_build, source, record["digest"])
        staged[image_id] = {**record, "ghcr_digest": record["digest"],
                            "dockerhub_digest": hub_digest}

    for record in staged.values():
        product, tag = record["product"], record["tag"]
        ghcr_source = f"ghcr.io/{owner}/{product}@{record['ghcr_digest']}"
        hub_source = f"docker.io/{hub_user}/{product}@{record['dockerhub_digest']}"
        if create(f"ghcr.io/{owner}/{product}:{tag}", ghcr_source) != record["ghcr_digest"]:
            raise RuntimeError(f"GHCR moving tag did not resolve to tested digest: {product}:{tag}")
        if create(f"docker.io/{hub_user}/{product}:{tag}", hub_source) != record["dockerhub_digest"]:
            raise RuntimeError(f"Docker Hub moving tag did not resolve to tested digest: {product}:{tag}")
    return staged


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--records", required=True)
    parser.add_argument("--output", required=True)
    args = parser.parse_args()
    owner = os.environ["GITHUB_REPOSITORY_OWNER"]
    hub_user = os.environ["DOCKERHUB_USERNAME"]
    records = json.loads(Path(args.records).read_text())
    Path(args.output).write_text(json.dumps(promote(records, owner, hub_user), indent=2) + "\n")


if __name__ == "__main__":
    main()
