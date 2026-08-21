#!/usr/bin/env bash

set -euo pipefail

script_directory="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
repository_root="$(git -C "$script_directory" rev-parse --show-toplevel 2>/dev/null)" || {
  echo "error: run this command inside a Git repository" >&2
  exit 2
}

temporary_root="$(mktemp -d)"
trap 'rm -rf -- "$temporary_root"' EXIT

new_case() {
  local name="$1"
  local case_root="$temporary_root/$name"
  mkdir -p "$case_root"
  cp -R "$repository_root/.agents" "$case_root/.agents"
  cp "$repository_root/AGENTS.md" "$repository_root/CLAUDE.md" "$case_root/"
  git -C "$case_root" init --quiet
  printf '%s\n' "$case_root"
}

expect_failure() {
  local name="$1"
  local case_root="$2"
  if bash "$case_root/.agents/skills/maintain-agent-workspace/scripts/check-agent-workspace.sh" \
    >/dev/null 2>&1; then
    echo "error: checker accepted invalid case: $name" >&2
    exit 1
  fi
}

valid_root="$(new_case valid)"
bash "$valid_root/.agents/skills/maintain-agent-workspace/scripts/check-agent-workspace.sh" \
  >/dev/null

metadata_root="$(new_case metadata)"
sed -i 's/name: web-ui/name: wrong-name/' \
  "$metadata_root/.agents/skills/web-ui/SKILL.md"
expect_failure metadata "$metadata_root"

yaml_root="$(new_case malformed-yaml)"
sed -i 's|^description:.*|description: invalid: yaml|' \
  "$yaml_root/.agents/skills/web-ui/SKILL.md"
expect_failure malformed-yaml "$yaml_root"

broken_link_root="$(new_case broken-link)"
printf '\n[Missing](references/missing.md)\n' \
  >>"$broken_link_root/.agents/skills/web-ui/SKILL.md"
expect_failure broken-link "$broken_link_root"

orphan_root="$(new_case orphan)"
mkdir -p "$orphan_root/.agents/skills/web-ui/references"
printf '# Orphan\n' >"$orphan_root/.agents/skills/web-ui/references/orphan.md"
expect_failure orphan "$orphan_root"

mode_root="$(new_case script-mode)"
chmod -x "$mode_root/.agents/skills/repository-changes/scripts/validate-change.sh"
expect_failure script-mode "$mode_root"

memory_root="$(new_case memory)"
mkdir -p "$memory_root/.agents/skills/web-ui/references"
printf '# Legacy memory\n' >"$memory_root/.agents/skills/web-ui/references/memory.md"
expect_failure memory "$memory_root"

for route in repository-changes maintain-agent-workspace repository-map container-images web-ui; do
  routing_root="$(new_case "routing-$route")"
  sed -i "s/\\\$${route}/${route}/" "$routing_root/AGENTS.md"
  expect_failure "routing-$route" "$routing_root"
done

stale_route_root="$(new_case stale-route)"
printf '\n- Use $removed-skill for removed behavior.\n' >>"$stale_route_root/AGENTS.md"
expect_failure stale-route "$stale_route_root"

nested_root="$(new_case nested-entrypoint)"
mkdir -p "$nested_root/nested"
printf '# Nested agent instructions\n' >"$nested_root/nested/AGENTS.md"
expect_failure nested-entrypoint "$nested_root"

pointer_root="$(new_case claude-pointer)"
sed -i 's/^Follow /Do not follow /' "$pointer_root/CLAUDE.md"
expect_failure claude-pointer "$pointer_root"

echo "Agent workspace checker tests passed."
