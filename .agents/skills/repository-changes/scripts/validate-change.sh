#!/usr/bin/env bash

set -euo pipefail

script_directory="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
repository_root="$(git -C "$script_directory" rev-parse --show-toplevel 2>/dev/null)" || {
  echo "error: run this command inside a Git repository" >&2
  exit 2
}

cd "$repository_root"

bash .github/scripts/validate-repository.sh
git diff --check
git diff --cached --check

echo "Repository change validation passed."
