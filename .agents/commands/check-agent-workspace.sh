#!/usr/bin/env bash

set -euo pipefail

script_directory="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
repository_root="$(git -C "$script_directory" rev-parse --show-toplevel 2>/dev/null)" || {
  echo "error: run this command inside a Git repository" >&2
  exit 2
}

cd "$repository_root"

workspace_readme=".agents/README.md"
memory_file=".agents/references/memory.md"

declare -a changed_files=()
while IFS= read -r -d '' path; do
  changed_files+=("$path")
done < <(
  {
    git diff --name-only -z HEAD --
    git ls-files --others --exclude-standard -z
  } | sort -zu
)

if ((${#changed_files[@]} > 0)); then
  memory_updated=false
  for path in "${changed_files[@]}"; do
    if [[ "$path" == "$memory_file" ]]; then
      memory_updated=true
      break
    fi
  done

  if [[ "$memory_updated" != true ]]; then
    echo "error: repository changes require an update to $memory_file" >&2
    exit 1
  fi
fi

if [[ ! -f "$workspace_readme" || ! -f "$memory_file" ]]; then
  echo "error: workspace README and memory file are required" >&2
  exit 1
fi

if ! diff -u \
  <(
    {
      echo ".agents/"
      find .agents -mindepth 1 -type d -printf '%P/\n'
      find .agents -mindepth 1 \( -type f -o -type l \) -printf '%P\n'
    } | sort
  ) \
  <(
    awk '
      $0 == "## Workspace list" { in_section = 1; next }
      in_section && $0 == "```text" { in_list = 1; next }
      in_list && $0 == "```" { exit }
      in_list && / — / { sub(/ — .*/, ""); print }
    ' "$workspace_readme" | sort
  ); then
  echo "error: $workspace_readme must list every current .agents path exactly once" >&2
  exit 1
fi

echo "Agent workspace checks passed."
