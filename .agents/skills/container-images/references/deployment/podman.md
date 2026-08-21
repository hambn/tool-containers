# Rootless Podman

Podman recipes mirror the plain Docker interface while preserving rootless and SELinux
behavior.

- Use executable Bash with `set -euo pipefail`, required-variable assertions, quoted
  arguments, `/workspace`, and `"$@"` pass-through.
- Mount the current workspace as `-v "$PWD:/workspace:Z"` where SELinux relabeling is
  required. Document when `:z` shared labeling or no relabeling is more appropriate.
- Use the published GHCR image for connected operation and avoid privileged/rootful
  assumptions.
- When offline Podman is supported, load the tar with `podman load`, select the resulting
  local tag, and run with `--pull=never`.
- Do not assume Docker-specific socket paths, Compose behavior, or security options work
  unchanged under Podman.

The README states rootless prerequisites, any subuid/subgid or SELinux requirements,
exact run and cleanup commands, secrets, workspace behavior, and air-gapped preparation.
Run `bash -n` and a rootless smoke test when Podman is available.
