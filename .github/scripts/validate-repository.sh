#!/usr/bin/env bash
set -euo pipefail

cd "$(git rev-parse --show-toplevel)"

bash .agents/skills/maintain-agent-workspace/scripts/check-agent-workspace.sh
bash .agents/skills/maintain-agent-workspace/scripts/test-check-agent-workspace.sh
python3 -B .github/scripts/test_validate_pr_metadata.py
python3 -B .github/scripts/test_image_plan.py
python3 -B .github/scripts/test_image_release.py
python3 -B .github/scripts/validate_repository.py

while IFS= read -r -d '' file; do
    bash -n "$file"
done < <(find .github/scripts tools -type f -name '*.sh' -print0)

while IFS= read -r -d '' file; do
    [[ -x "$file" ]] || { echo "not executable: $file" >&2; exit 1; }
done < <(find .github/scripts -type f -name '*.sh' -print0)

export WORKSPACE="$PWD" OPENAI_API_KEY=validation ANTHROPIC_API_KEY=validation
if command -v docker >/dev/null && docker compose version >/dev/null 2>&1; then
    while IFS= read -r -d '' file; do
        docker compose -f "$file" config --quiet
    done < <(find tools -type f \( -name '*compose*.yml' -o -name '*compose*.yaml' \) -print0)
fi
if command -v helm >/dev/null; then
    while IFS= read -r -d '' chart; do
        helm lint "$chart" >/dev/null
        helm template validation "$chart" >/dev/null
    done < <(find tools -type f -name Chart.yaml -printf '%h\0')
fi

echo "Repository validation passed. No image was built or pulled."
