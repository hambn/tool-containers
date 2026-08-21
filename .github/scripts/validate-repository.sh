#!/usr/bin/env bash
set -euo pipefail

root=$(git rev-parse --show-toplevel)
cd "$root"

bash .agents/skills/maintain-agent-workspace/scripts/check-agent-workspace.sh
bash .agents/skills/maintain-agent-workspace/scripts/test-check-agent-workspace.sh
python3 -B .github/scripts/test_validate_pr_metadata.py

command -v python3 >/dev/null
python3 - <<'PY'
import pathlib
import re
import subprocess
import sys

try:
    import yaml
except ImportError:
    print("PyYAML is required for workflow validation", file=sys.stderr)
    raise SystemExit(1)

workflows = sorted(pathlib.Path(".github/workflows").glob("*.yml"))


def workflow_triggers(document):
    return document.get("on", document.get(True, {})) or {}


pull_request_workflow = pathlib.Path(".github/workflows/pull-request.yml")
legacy_pull_request_workflows = {
    pathlib.Path(".github/workflows/dependency-review.yml"),
    pathlib.Path(".github/workflows/pr-policy.yml"),
    pathlib.Path(".github/workflows/validate-repository.yml"),
}
if not pull_request_workflow.is_file():
    raise SystemExit("missing consolidated pull-request workflow")
present_legacy = sorted(path.as_posix() for path in legacy_pull_request_workflows if path.exists())
if present_legacy:
    raise SystemExit(f"obsolete pull-request workflows remain: {present_legacy}")

pull_request_document = yaml.safe_load(pull_request_workflow.read_text()) or {}
pull_request_triggers = workflow_triggers(pull_request_document)
expected_pull_request_triggers = {"pull_request", "merge_group", "workflow_dispatch"}
if set(pull_request_triggers) != expected_pull_request_triggers:
    raise SystemExit(
        f"{pull_request_workflow}: trigger set must be "
        f"{sorted(expected_pull_request_triggers)}"
    )
for required_trigger in ("pull_request", "merge_group"):
    if required_trigger not in pull_request_triggers:
        raise SystemExit(
            f"{pull_request_workflow}: missing {required_trigger} trigger for the required gate"
        )
pull_request_options = pull_request_triggers.get("pull_request") or {}
if isinstance(pull_request_options, dict) and any(
    key in pull_request_options for key in ("branches", "branches-ignore", "paths", "paths-ignore")
):
    raise SystemExit(f"{pull_request_workflow}: required gate must not use event filters")
gate = (pull_request_document.get("jobs") or {}).get("gate") or {}
if gate.get("name") != "Pull request gate":
    raise SystemExit(f"{pull_request_workflow}: gate job name must remain 'Pull request gate'")
if gate.get("permissions") != {"contents": "read"}:
    raise SystemExit(f"{pull_request_workflow}: gate must have contents: read only")
gate_text = pull_request_workflow.read_text()
for needle, label in {
    ".github/scripts/validate_pr_metadata.py": "metadata policy",
    "actions/dependency-review-action@": "dependency review",
    ".github/scripts/validate-repository.sh": "repository validation",
}.items():
    if needle not in gate_text:
        raise SystemExit(f"{pull_request_workflow}: missing {label}")
pull_request_types = pull_request_options.get("types") or []
if isinstance(pull_request_types, str):
    pull_request_types = [pull_request_types]
required_pull_request_types = {"opened", "edited", "synchronize", "reopened"}
if set(pull_request_types) != required_pull_request_types:
    raise SystemExit(
        f"{pull_request_workflow}: pull_request.types must be "
        f"{sorted(required_pull_request_types)}"
    )
requirements_path = pathlib.Path(".github/requirements.txt")
if not requirements_path.is_file():
    raise SystemExit(f"missing validation dependency file: {requirements_path}")
if "-r .github/requirements.txt" not in gate_text:
    raise SystemExit(f"{pull_request_workflow}: validation dependencies must use {requirements_path}")
requirements = [
    line.strip()
    for line in requirements_path.read_text().splitlines()
    if line.strip() and not line.lstrip().startswith("#")
]
if len(requirements) != 1 or not re.fullmatch(r"PyYAML==\d+\.\d+\.\d+", requirements[0]):
    raise SystemExit(f"{requirements_path}: expected one exact PyYAML version pin")

dependabot_path = pathlib.Path(".github/dependabot.yml")
dependabot = yaml.safe_load(dependabot_path.read_text()) or {}
if dependabot.get("version") != 2 or not isinstance(dependabot.get("updates"), list):
    raise SystemExit(f"{dependabot_path}: expected Dependabot version 2 updates")
expected_dependabot = {
    ("github-actions", "/"): "chore(actions)",
    ("pip", "/.github"): "chore(python)",
}
actual_dependabot = {}
for update in dependabot["updates"]:
    if not isinstance(update, dict):
        raise SystemExit(f"{dependabot_path}: every update must be a mapping")
    key = (update.get("package-ecosystem"), update.get("directory"))
    actual_dependabot[key] = (update.get("commit-message") or {}).get("prefix")
    if (update.get("schedule") or {}).get("interval") != "weekly":
        raise SystemExit(f"{dependabot_path}: {key} must use a weekly schedule")
    if (update.get("cooldown") or {}).get("default-days") != 7:
        raise SystemExit(f"{dependabot_path}: {key} must use the seven-day cooldown")
if actual_dependabot != expected_dependabot:
    raise SystemExit(
        f"{dependabot_path}: ecosystem/directory/prefix mismatch: {actual_dependabot}"
    )

issue_directory = pathlib.Path(".github/ISSUE_TEMPLATE")
issue_config_path = issue_directory / "config.yml"
issue_config = yaml.safe_load(issue_config_path.read_text()) or {}
if issue_config.get("blank_issues_enabled") is not False:
    raise SystemExit(f"{issue_config_path}: blank issues must remain disabled")
for index, link in enumerate(issue_config.get("contact_links") or []):
    if not isinstance(link, dict) or not all(link.get(key) for key in ("name", "url", "about")):
        raise SystemExit(f"{issue_config_path}: invalid contact link at index {index}")
    if not link["url"].startswith("https://"):
        raise SystemExit(f"{issue_config_path}: contact link must use HTTPS: {link['url']}")

expected_issue_forms = {
    "bug-report.yml": {"bug"},
    "feature-request.yml": {"enhancement"},
    "usage-question.yml": {"question"},
}
issue_forms = {
    path.name: path
    for path in issue_directory.glob("*.yml")
    if path.name != "config.yml"
}
if set(issue_forms) != set(expected_issue_forms):
    raise SystemExit(
        "issue-form mismatch: "
        f"missing={sorted(set(expected_issue_forms) - set(issue_forms))}, "
        f"unexpected={sorted(set(issue_forms) - set(expected_issue_forms))}"
    )
for form_name, path in sorted(issue_forms.items()):
    document = yaml.safe_load(path.read_text()) or {}
    if not all(document.get(key) for key in ("name", "description", "body")):
        raise SystemExit(f"{path}: issue form requires name, description, and body")
    labels = document.get("labels") or []
    if not isinstance(labels, list) or not all(isinstance(label, str) for label in labels):
        raise SystemExit(f"{path}: labels must be a list of strings")
    if set(labels) != expected_issue_forms[form_name]:
        raise SystemExit(f"{path}: unexpected labels: {labels}")
    seen_ids = set()
    for index, element in enumerate(document["body"]):
        if not isinstance(element, dict):
            raise SystemExit(f"{path}: body item {index} must be a mapping")
        kind = element.get("type")
        if kind not in {"checkboxes", "dropdown", "input", "markdown", "textarea"}:
            raise SystemExit(f"{path}: unsupported body type at index {index}: {kind}")
        attributes = element.get("attributes") or {}
        if not isinstance(attributes, dict):
            raise SystemExit(f"{path}: body item {index} attributes must be a mapping")
        if kind == "markdown":
            if not attributes.get("value"):
                raise SystemExit(f"{path}: markdown item {index} requires attributes.value")
            continue
        element_id = element.get("id")
        if not isinstance(element_id, str) or not re.fullmatch(r"[A-Za-z0-9_-]+", element_id):
            raise SystemExit(f"{path}: body item {index} has an invalid id")
        if element_id in seen_ids:
            raise SystemExit(f"{path}: duplicate body id {element_id}")
        seen_ids.add(element_id)
        if not attributes.get("label"):
            raise SystemExit(f"{path}: body item {element_id} requires attributes.label")
        validations = element.get("validations") or {}
        if not isinstance(validations, dict) or any(
            not isinstance(value, bool) for value in validations.values()
        ):
            raise SystemExit(f"{path}: body item {element_id} has invalid validations")
        if kind == "dropdown":
            options = attributes.get("options")
            if not isinstance(options, list) or not options or not all(
                isinstance(option, str) and option.strip() for option in options
            ):
                raise SystemExit(f"{path}: dropdown {element_id} requires string options")
        if kind == "checkboxes":
            options = attributes.get("options")
            if not isinstance(options, list) or not options:
                raise SystemExit(f"{path}: checkboxes {element_id} requires options")
            for option in options:
                if not isinstance(option, dict) or not option.get("label"):
                    raise SystemExit(f"{path}: checkboxes {element_id} has an invalid option")
                if "required" in option and not isinstance(option["required"], bool):
                    raise SystemExit(
                        f"{path}: checkboxes {element_id} option required must be boolean"
                    )

labeler_workflow = pathlib.Path(".github/workflows/pr-labeler.yml")
labeler_document = yaml.safe_load(labeler_workflow.read_text()) or {}
labeler_triggers = workflow_triggers(labeler_document)
if set(labeler_triggers) != {"pull_request_target"}:
    raise SystemExit(f"{labeler_workflow}: labeler must use pull_request_target only")
label_job = (labeler_document.get("jobs") or {}).get("label") or {}
if label_job.get("permissions") != {"contents": "read", "pull-requests": "write"}:
    raise SystemExit(f"{labeler_workflow}: label job permissions changed")
label_steps = label_job.get("steps") or []
if any(
    isinstance(step, dict) and str(step.get("uses", "")).startswith("actions/checkout@")
    for step in label_steps
):
    raise SystemExit(f"{labeler_workflow}: privileged labeler must not check out code")
if not any(
    isinstance(step, dict)
    and str(step.get("uses", "")).startswith("actions/labeler@")
    and (step.get("with") or {}).get("sync-labels") is True
    for step in label_steps
):
    raise SystemExit(f"{labeler_workflow}: missing synchronized actions/labeler step")
label_rules_path = pathlib.Path(".github/labeler.yml")
label_rules = yaml.safe_load(label_rules_path.read_text()) or {}
if set(label_rules) != {"documentation"} or "**/*.md" not in label_rules_path.read_text():
    raise SystemExit(f"{label_rules_path}: expected the documentation-only label rule")

web_ui_files = [
    path
    for path in pathlib.Path("web-ui").rglob("*")
    if path.is_file() and path.name != ".gitkeep"
]
if web_ui_files:
    web_ui_workflows = []
    for path in workflows:
        if not path.stem.startswith("web-ui"):
            continue
        document = yaml.safe_load(path.read_text()) or {}
        triggers = workflow_triggers(document)
        paths = (triggers.get("pull_request") or {}).get("paths") or []
        if isinstance(paths, str):
            paths = [paths]
        if "web-ui/**" in paths:
            web_ui_workflows.append(path)
    if not web_ui_workflows:
        raise SystemExit(
            "a scaffolded web-ui requires a dedicated web-ui*.yml workflow "
            "with web-ui/** in its pull_request.paths filter"
        )

image_projects = {
    f"{category.name}-{tool.name}": tool
    for category in pathlib.Path("images").iterdir()
    if category.is_dir()
    for tool in category.iterdir()
    if tool.is_dir()
}
publish_by_name = {
    path.stem: path
    for path in workflows
    if re.search(r"^\s+IMAGE:\s*\S+", path.read_text(), re.MULTILINE)
    and re.search(r"^\s+PRIMARY:\s*\S+", path.read_text(), re.MULTILINE)
}
missing_publishers = sorted(image_projects.keys() - publish_by_name.keys())
unexpected_publishers = sorted(publish_by_name.keys() - image_projects.keys())
if missing_publishers or unexpected_publishers:
    raise SystemExit(
        "image project/workflow mismatch: "
        f"missing={missing_publishers}, unexpected={unexpected_publishers}"
    )
publish = sorted(publish_by_name.values())

for name, project in sorted(image_projects.items()):
    for required in (project / "README.md", project / "images", project / "deployment"):
        if not required.exists():
            raise SystemExit(f"{name}: missing required project path {required}")

catalog_targets = [
    target.removeprefix("./").rstrip("/")
    for target in re.findall(r"\[[^]]+\]\(([^)]+)\)", pathlib.Path("README.md").read_text())
    if target.removeprefix("./").startswith("images/")
]
expected_catalog = {project.as_posix() for project in image_projects.values()}
if len(catalog_targets) != len(set(catalog_targets)):
    raise SystemExit("root README contains a duplicate image-project catalog link")
if set(catalog_targets) != expected_catalog:
    raise SystemExit(
        "image project/catalog mismatch: "
        f"missing={sorted(expected_catalog - set(catalog_targets))}, "
        f"unexpected={sorted(set(catalog_targets) - expected_catalog)}"
    )

for path in workflows:
    document = yaml.safe_load(path.read_text()) or {}
    text = path.read_text()
    if document.get("permissions") != {}:
        raise SystemExit(f"{path}: workflow must deny token permissions by default")
    if not document.get("concurrency"):
        raise SystemExit(f"{path}: workflow must declare concurrency")
    for job in document.get("jobs", {}).values():
        if not job.get("name"):
            raise SystemExit(f"{path}: every job must declare a display name")
        if "permissions" not in job:
            raise SystemExit(f"{path}: every job must declare explicit token permissions")
        if not job.get("timeout-minutes"):
            raise SystemExit(f"{path}: every job must declare a timeout")
        if job.get("runs-on") == "ubuntu-latest":
            raise SystemExit(f"{path}: use an explicit Ubuntu runner version")
        for step in job.get("steps", []) if isinstance(job, dict) else []:
            action = step.get("uses") if isinstance(step, dict) else None
            if action and action.startswith("actions/checkout@"):
                options = step.get("with") or {}
                if options.get("persist-credentials") is not False:
                    raise SystemExit(f"{path}: checkout must disable persisted credentials")
            run = step.get("run") if isinstance(step, dict) else None
            if run:
                result = subprocess.run(["bash", "-n"], input=run, text=True, capture_output=True)
                if result.returncode:
                    raise SystemExit(f"{path}: embedded shell syntax error: {result.stderr.strip()}")
    if path in publish:
        triggers = workflow_triggers(document)
        if "workflow_run" in triggers:
            raise SystemExit(f"{path}: publisher must detect upstream drift on its schedule")
        for required_trigger in ("push", "schedule", "workflow_dispatch"):
            if required_trigger not in triggers:
                raise SystemExit(f"{path}: missing {required_trigger} trigger")
        push_options = triggers.get("push") or {}
        push_paths = push_options.get("paths") or []
        if isinstance(push_paths, str):
            push_paths = [push_paths]
        project = image_projects[path.stem]
        expected_push_paths = {
            f"{project.as_posix()}/images/**",
            f".github/workflows/{path.name}",
            ".github/scripts/registry-inspect.sh",
        }
        if set(push_paths) != expected_push_paths:
            raise SystemExit(
                f"{path}: publisher path mismatch: "
                f"missing={sorted(expected_push_paths - set(push_paths))}, "
                f"unexpected={sorted(set(push_paths) - expected_push_paths)}"
            )
        expected_permissions = {
            "plan": {"contents": "read", "packages": "read"},
            "build": {"contents": "read", "packages": "write"},
            "push": {"packages": "write"},
        }
        push_job = (document.get("jobs") or {}).get("push") or {}
        if push_job.get("environment") != "${{ matrix.registry }}":
            raise SystemExit(f"{path}: push job must use the registry-named environment")
        for job_name, permissions in expected_permissions.items():
            actual = (document.get("jobs") or {}).get(job_name, {}).get("permissions")
            if actual != permissions:
                raise SystemExit(
                    f"{path}: {job_name} permissions must be {permissions}, found {actual}"
                )
        required = {
            "concurrency:": "concurrency",
            "cancel-in-progress: false": "non-canceling concurrency",
            "timeout-minutes:": "job timeout",
            "fetch-depth: 0": "full-history checkout",
            "provenance: mode=max": "max-level provenance",
            "sbom: true": "SBOM",
            "severity: HIGH,CRITICAL": "Trivy severity",
            'exit-code: "1"': "Trivy gate",
            "scope=${{ env.IMAGE }}-${{ matrix.variant }}": "unique cache scope",
            "github.ref == 'refs/heads/main'": "main-only dispatch",
            '".github/scripts/registry-inspect.sh"': "registry-helper push trigger",
            "retention-days: 1": "short-lived digest artifacts",
        }
        for needle, label in required.items():
            if needle not in text:
                raise SystemExit(f"{path}: missing {label}")
        if "continue-on-error: true" in text:
            raise SystemExit(f"{path}: publishing must fail closed on scan errors")
        if "2>/dev/null || true" in text:
            raise SystemExit(f"{path}: suppressed planning error")
    for line in text.splitlines():
        match = re.search(r"\buses:\s*([^#\s]+)", line)
        if not match or match.group(1).startswith("./"):
            continue
        if not re.fullmatch(r"[^@]+@[0-9a-f]{40}", match.group(1)):
            raise SystemExit(f"{path}: action must use a full commit SHA: {line}")

for path in pathlib.Path("images/ai").glob("*/images/*/Dockerfile"):
    text = path.read_text()
    if "ARG BASE_IMAGE" not in text or "FROM ${BASE_IMAGE}" not in text:
        raise SystemExit(f"{path}: derived image must use global BASE_IMAGE")
    users = [line.strip() for line in text.splitlines() if line.strip().startswith("USER ")]
    if not users or users[-1] != "USER sysadmin":
        raise SystemExit(f"{path}: derived image must restore USER sysadmin")
    workdirs = [line.strip() for line in text.splitlines() if line.strip().startswith("WORKDIR ")]
    if not workdirs or workdirs[-1] != "WORKDIR /workspace":
        raise SystemExit(f"{path}: derived image must end in WORKDIR /workspace")

for path in pathlib.Path("images/base/agentimg/images").glob("*.Dockerfile"):
    text = path.read_text()
    if "ARG RUNTIME_BASE" not in text or "FROM ${RUNTIME_BASE}" not in text:
        raise SystemExit(f"{path}: missing global RUNTIME_BASE contract")
    from_count = sum(1 for line in text.splitlines() if line.strip().upper().startswith("FROM "))
    if from_count > 1 and "ARG BROWSER_BASE" not in text:
        raise SystemExit(f"{path}: missing global BROWSER_BASE contract")
    users = [line.strip() for line in text.splitlines() if line.strip().startswith("USER ")]
    if not users or users[-1] != "USER sysadmin":
        raise SystemExit(f"{path}: foundation image must run as USER sysadmin")
    workdirs = [line.strip() for line in text.splitlines() if line.strip().startswith("WORKDIR ")]
    if not workdirs or workdirs[-1] != "WORKDIR /home/sysadmin":
        raise SystemExit(f"{path}: foundation image must end in WORKDIR /home/sysadmin")
PY

while IFS= read -r -d '' file; do
    bash -n "$file"
done < <(find .github/scripts images -type f -name '*.sh' -print0)

while IFS= read -r -d '' file; do
    mode=$(stat -c '%A' "$file")
    [[ "$mode" == -*x* ]] || { echo "not executable: $file" >&2; exit 1; }
done < <(find .github/scripts -type f -name '*.sh' -print0)

while IFS= read -r -d '' file; do
    mode=$(stat -c '%A' "$file")
    [[ "$mode" == -*x* ]] || { echo "not executable: $file" >&2; exit 1; }
done < <(find images -path '*/deployment/*' -type f -name '*.sh' -print0)

python3 - <<'PY'
import pathlib, re, sys

for path in pathlib.Path(".").rglob("*.md"):
    if any(part in {".git", ".tmp", ".codex", ".claude"} for part in path.parts):
        continue
    for target in re.findall(r"\[[^]]+\]\(([^)]+)\)", path.read_text()):
        if target.startswith(("http://", "https://", "#", "mailto:")) or "<" in target:
            continue
        target = target.split("#", 1)[0]
        if target and not (path.parent / target).exists():
            raise SystemExit(f"{path}: missing local link {target}")
PY

export WORKSPACE="$root" OPENAI_API_KEY=validation ANTHROPIC_API_KEY=validation
if command -v docker >/dev/null && docker compose version >/dev/null 2>&1; then
    while IFS= read -r -d '' file; do
        docker compose -f "$file" config --quiet
    done < <(find . -type f \( -name '*compose*.yml' -o -name '*compose*.yaml' \) -print0)
else
    echo "Docker Compose unavailable; skipped render (no build/pull performed)"
fi

if command -v helm >/dev/null; then
    while IFS= read -r -d '' chart; do
        helm lint "$chart" >/dev/null
        helm template validation "$chart" >/dev/null
    done < <(find . -type f -name Chart.yaml -printf '%h\0')
else
    echo "Helm unavailable; skipped lint/template"
fi

echo "Static repository validation passed (no image build or pull performed)."
