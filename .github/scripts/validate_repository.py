#!/usr/bin/env python3
"""Check the catalog, image sources, workflows, and local document links."""

import pathlib
import re
import subprocess
import sys

import yaml

from image_plan import ROOT, load_catalog


def fail(message):
    raise SystemExit(message)


images = load_catalog()
products = {image["product"] for image in images}
catalog_dockerfiles = {pathlib.Path(image["dockerfile"]) for image in images}
source_dockerfiles = set(pathlib.Path("tools").rglob("Dockerfile"))
if source_dockerfiles != catalog_dockerfiles:
    fail(f"Dockerfiles differ from catalog: missing={source_dockerfiles - catalog_dockerfiles}, extra={catalog_dockerfiles - source_dockerfiles}")
expected = {f"tools/{'ai' if product not in {'runtime', 'workspace'} else ('base' if product == 'runtime' else 'dev')}/{product}"
            for product in products}
actual = {path.parent.as_posix() for path in pathlib.Path("tools").glob("*/*/README.md")}
if actual != expected:
    fail(f"catalog projects differ from tool READMEs: missing={expected - actual}, extra={actual - expected}")

catalog_text = pathlib.Path("README.md").read_text()
for project in expected:
    if f"./{project}/" not in catalog_text:
        fail(f"root catalog is missing {project}")
if "tools/base/agentimg" in catalog_text:
    fail("root catalog still links the retired agentimg project")

for image in images:
    path = pathlib.Path(image["dockerfile"])
    text = path.read_text()
    if "FROM " not in text or not re.search(r"^USER (sysadmin|1000:1000)$", text, re.M):
        fail(f"{path}: missing FROM or non-root final user")
    if not text.startswith("# syntax=docker/dockerfile:1"):
        fail(f"{path}: Dockerfile syntax must be explicit")
    if "latest" in image["tag"]:
        fail(f"{path}: ambiguous moving tag")

for project in expected:
    readme = pathlib.Path(project) / "README.md"
    content = readme.read_text()
    for file in pathlib.Path(project).rglob("*"):
        if not file.is_file() or file == readme:
            continue
        relative = file.relative_to(readme.parent).as_posix()
        if relative not in content:
            fail(f"{readme}: missing file map entry for {relative}")

workflows = sorted(pathlib.Path(".github/workflows").glob("*.yml"))
for path in workflows:
    text = path.read_text()
    document = yaml.safe_load(text) or {}
    if document.get("permissions") != {}:
        fail(f"{path}: workflow permissions must default to none")
    for name, job in (document.get("jobs") or {}).items():
        if "permissions" not in job or not job.get("timeout-minutes"):
            fail(f"{path}: {name} lacks permissions or timeout")
        for step in job.get("steps", []):
            action = step.get("uses", "")
            if action and not action.startswith("./") and not re.fullmatch(r"[^@]+@[0-9a-f]{40}", action):
                fail(f"{path}: unpinned action: {action}")
            if action.startswith("actions/checkout@") and (step.get("with") or {}).get("persist-credentials") is not False:
                fail(f"{path}: checkout must disable persisted credentials")
            if step.get("run"):
                result = subprocess.run(["bash", "-n"], input=step["run"], text=True, capture_output=True)
                if result.returncode:
                    fail(f"{path}: embedded shell syntax error: {result.stderr.strip()}")

publisher = pathlib.Path(".github/workflows/publish-images.yml")
if not publisher.exists():
    fail("missing shared image publisher")
if list(pathlib.Path(".github/workflows").glob("ai-*.yml")) or pathlib.Path(".github/workflows/base-agentimg.yml").exists():
    fail("retired per-product publisher remains")
publish = yaml.safe_load(publisher.read_text())
jobs = publish["jobs"]
if set(jobs) != {"plan", "build", "scan", "promote"}:
    fail("publisher needs plan, build, scan, and promote jobs")
if jobs["promote"].get("needs") != ["plan", "build", "scan"]:
    fail("promotion must depend on the vulnerability and secret scans")
if jobs["promote"].get("environment") != "dockerhub":
    fail("Docker Hub credentials must stay in the dockerhub environment")
if "ignore-unfixed" in publisher.read_text():
    fail("publisher must not hide all unfixed vulnerabilities")

for path in pathlib.Path(".").rglob("*.md"):
    if any(part in {".git", ".tmp", ".codex", "node_modules", "dist", "build", "coverage", ".venv"}
           for part in path.parts):
        continue
    for target in re.findall(r"\[[^]]+\]\(([^)]+)\)", path.read_text()):
        if target.startswith(("http://", "https://", "#", "mailto:")) or "<" in target:
            continue
        target = target.split("#", 1)[0]
        if target and not (path.parent / target).exists():
            fail(f"{path}: missing local link {target}")

print(f"Validated {len(images)} catalog images, {len(products)} products, and {len(workflows)} workflows")
