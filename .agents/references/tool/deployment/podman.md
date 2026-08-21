# Rootless Podman

Podman recipes mirror Docker recipes while accounting for rootless execution and SELinux.

## Rules

- Use `set -euo pipefail`, assert required environment variables, mount `/workspace`, and
  pass `"$@"` through as with Docker.
- Use `-v "$PWD:/workspace:Z"` where SELinux relabeling is required.
- Reference `ghcr.io/<owner>/<tool>:latest` for normal runs.
- Add an air-gapped script when the tool needs offline Podman support; use `podman load`
  and `--pull=never`.
