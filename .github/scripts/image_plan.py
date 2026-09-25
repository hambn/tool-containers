#!/usr/bin/env python3
"""Resolve image inputs and select the affected dependency graph."""

import argparse
import datetime as dt
import hashlib
import json
import os
from pathlib import Path
import re
import subprocess
import sys
from urllib.request import urlopen


ROOT = Path(__file__).resolve().parents[2]
CATALOG = ROOT / ".github/image-catalog.json"


def command(*args):
    return subprocess.check_output(args, cwd=ROOT, text=True).strip()


def load_catalog(path=CATALOG):
    data = json.loads(Path(path).read_text())
    if data.get("schema") != 1:
        raise ValueError("unsupported image catalog schema")
    images = data["images"]
    ids = {image["id"] for image in images}
    if len(ids) != len(images):
        raise ValueError("duplicate image ID")
    tags = {(image["product"], image["tag"]) for image in images}
    if len(tags) != len(images):
        raise ValueError("duplicate product tag")
    for image in images:
        if not set(image["deps"]) <= ids:
            raise ValueError(f"unknown dependency in {image['id']}")
        for key in ("context", "dockerfile"):
            if not (ROOT / image[key]).exists():
                raise ValueError(f"missing {key} for {image['id']}: {image[key]}")
    return topological(images)


def topological(images):
    pending = {image["id"]: image for image in images}
    ordered = []
    while pending:
        ready = [image for image in pending.values() if set(image["deps"]) <= {item["id"] for item in ordered}]
        if not ready:
            raise ValueError("image dependency cycle")
        for image in ready:
            ordered.append(image)
            del pending[image["id"]]
    return ordered


def affected(images, changed):
    changed = set(changed)
    all_images = bool(changed.intersection({
        ".github/image-catalog.json",
        ".github/scripts/image_plan.py",
        ".github/scripts/image_build.py",
    }))
    selected = set()
    for image in images:
        direct = all_images or any(
            path == item or path.startswith(item)
            for item in image["inputs"]
            for path in changed
        )
        if direct or selected.intersection(image["deps"]):
            selected.add(image["id"])
    return selected


def source_files(image):
    paths = set()
    for item in image["inputs"]:
        source = ROOT / item
        if source.is_file():
            paths.add(source)
        elif source.is_dir():
            paths.update(path for path in source.rglob("*") if path.is_file())
        else:
            raise ValueError(f"missing image input: {item}")
    paths.add(ROOT / image["dockerfile"])
    return sorted(paths)


def source_digest(image):
    sha = hashlib.sha256()
    for path in source_files(image):
        sha.update(path.relative_to(ROOT).as_posix().encode())
        sha.update(b"\0")
        sha.update(path.read_bytes())
        sha.update(b"\0")
    return sha.hexdigest()


def inspect(ref, template):
    result = subprocess.run(
        ["docker", "buildx", "imagetools", "inspect", ref, "--format", template],
        cwd=ROOT, text=True, capture_output=True,
    )
    if result.returncode == 0:
        return result.stdout.strip()
    if re.search(r"manifest\s+unknown|MANIFEST_UNKNOWN|NAME_UNKNOWN|status code: 404|404 Not Found", result.stderr, re.I):
        return None
    raise RuntimeError(f"registry inspection failed for {ref}: {result.stderr.strip()}")


def version(source):
    kind, name = source["type"], source["name"]
    if kind == "npm":
        return command("npm", "view", name, "version")
    if kind == "pypi":
        with urlopen(f"https://pypi.org/pypi/{name}/json", timeout=30) as response:
            return json.load(response)["info"]["version"]
    if kind == "cursor":
        with urlopen("https://cursor.com/install", timeout=30) as response:
            script = response.read().decode()
        match = re.search(r'DOWNLOAD_URL="https://downloads.cursor.com/lab/([^/]+)/', script)
        if not match:
            raise ValueError("unable to resolve Cursor Agent release")
        return match.group(1)
    if kind == "go":
        with urlopen("https://go.dev/dl/?mode=json", timeout=30) as response:
            releases = json.load(response)
        return next(release["version"] for release in releases if release["stable"])
    if kind == "node-lts":
        url = ("https://unofficial-builds.nodejs.org/download/release/index.json"
               if name == "musl" else "https://nodejs.org/dist/index.json")
        architecture = "linux-x64-musl" if name == "musl" else "linux-x64"
        with urlopen(url, timeout=30) as response:
            releases = json.load(response)
        return next(release["version"] for release in releases
                    if release.get("lts") and architecture in release.get("files", []))
    if kind == "github-release":
        with urlopen(f"https://api.github.com/repos/{name}/releases/latest", timeout=30) as response:
            return json.load(response)["tag_name"]
    if kind == "gitlab-release":
        with urlopen("https://gitlab.com/api/v4/projects/gitlab-org%2Fcli/releases/permalink/latest", timeout=30) as response:
            return json.load(response)["tag_name"].removeprefix("v")
    if kind == "kubectl":
        with urlopen("https://dl.k8s.io/release/stable.txt", timeout=30) as response:
            return response.read().decode().strip()
    if kind == "git-tags":
        url = f"https://github.com/{name}.git"
        lines = command("git", "ls-remote", "--tags", "--refs", url).splitlines()
        prefix = "kustomize/" if name == "kubernetes-sigs/kustomize" else ""
        tags = [line.split("refs/tags/", 1)[1].removeprefix(prefix)
                for line in lines if "refs/tags/" in line
                and line.split("refs/tags/", 1)[1].startswith(prefix)]
        tags = [tag for tag in tags if re.fullmatch(r"v\d+\.\d+\.\d+", tag)]
        if not tags:
            raise ValueError(f"no stable tags for {name}")
        return max(tags, key=lambda tag: tuple(map(int, tag[1:].split("."))))
    raise ValueError(f"unsupported version source: {kind}")


def resolve(images, owner, now, force=False):
    versions = {}
    bases = {}
    result = []
    fingerprints = {}
    pipeline_digest = hashlib.sha256(
        (ROOT / ".github/scripts/image_build.py").read_bytes()
        + (ROOT / ".github/scripts/image_plan.py").read_bytes()
    ).hexdigest()
    for image in images:
        resolved_versions = {}
        for arg, source in image["versions"].items():
            key = (source["type"], source["name"])
            if key not in versions:
                versions[key] = version(source)
            resolved_versions[arg] = versions[key]
        resolved_bases = {}
        for arg, ref in image["bases"].items():
            if ref not in bases:
                bases[ref] = inspect(ref, "{{.Manifest.Digest}}")
                if not bases[ref]:
                    raise ValueError(f"missing base image: {ref}")
            resolved_bases[arg] = f"{ref}@{bases[ref]}"
        payload = {
            "source": source_digest(image),
            "pipeline": pipeline_digest,
            "versions": resolved_versions,
            "bases": resolved_bases,
            "deps": {dep: fingerprints[dep] for dep in image["deps"]},
        }
        if image["product"] in {"runtime", "workspace"}:
            payload["refresh_week"] = now.strftime("%G-W%V")
        fingerprint = hashlib.sha256(json.dumps(payload, sort_keys=True).encode()).hexdigest()
        fingerprints[image["id"]] = fingerprint
        ref = f"ghcr.io/{owner}/{image['product']}:{image['tag']}"
        previous = inspect(ref, '{{ index .Image.Config.Labels "io.tool-containers.inputs-sha256" }}')
        selected = force or previous != fingerprint
        result.append({**image, "resolved_versions": resolved_versions, "resolved_bases": resolved_bases,
                       "refresh_week": payload.get("refresh_week"),
                       "fingerprint": fingerprint, "selected": selected})
    return result


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--mode", choices=("pr", "publish"), required=True)
    parser.add_argument("--owner", default=os.environ.get("GITHUB_REPOSITORY_OWNER", "hambn"))
    parser.add_argument("--base", default="origin/main")
    parser.add_argument("--force", action="store_true")
    parser.add_argument("--output", required=True)
    args = parser.parse_args()
    images = load_catalog()
    if args.mode == "pr":
        changed = command("git", "diff", "--name-only", f"{args.base}...HEAD").splitlines()
        selected = affected(images, changed)
        planned = [{**image, "selected": image["id"] in selected,
                    "resolved_versions": {}, "resolved_bases": {}} for image in images]
    else:
        planned = resolve(images, args.owner, dt.datetime.now(dt.timezone.utc), args.force)
    run = os.environ.get("GITHUB_RUN_ID", "local")
    attempt = os.environ.get("GITHUB_RUN_ATTEMPT", "1")
    for image in planned:
        image["build_tag"] = f"{image['tag']}-b{run}-{attempt}"
    output = {"owner": args.owner, "mode": args.mode, "images": planned}
    Path(args.output).write_text(json.dumps(output, indent=2) + "\n")
    matrix = [{"id": image["id"], "product": image["product"], "tag": image["build_tag"]}
              for image in planned if image["selected"]]
    if os.environ.get("GITHUB_OUTPUT"):
        with open(os.environ["GITHUB_OUTPUT"], "a") as stream:
            stream.write(f"matrix={json.dumps(matrix, separators=(',', ':'))}\n")
            stream.write(f"build={'true' if matrix else 'false'}\n")
    print(json.dumps({"selected": [image["id"] for image in planned if image["selected"]]}))


if __name__ == "__main__":
    try:
        main()
    except (ValueError, RuntimeError, subprocess.CalledProcessError) as error:
        print(error, file=sys.stderr)
        sys.exit(1)
