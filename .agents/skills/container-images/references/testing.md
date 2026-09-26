# Image tests

CI runs these tests against every built variant before it can publish. They live in
`tools/<category>/<tool>/tests/` and are the only runtime proof an image change gets.

## Structure tests

`tests/structure.yaml` is a
[container-structure-test](https://github.com/GoogleContainerTools/container-structure-test)
file with `schemaVersion: 2.0.0`, applied to every variant. Optional additions are
applied too when present:

| File | Applies to |
|---|---|
| `structure-<distro>.yaml` | `alpine`, `ubuntu`, or `wolfi` variants |
| `structure-<tier>.yaml` | `core`, `lite`, `full`, or `browser` (base tiers) |
| `structure-<variant>.yaml` | one bake variant, for example `ubuntu-browser` |

Agent images carry tier `agent`; use distro or variant files for them, not tier files.

Cover the image contract: user and UID, work directory, entrypoint/command, the tool
answering `--version` (or equivalent) as the runtime user, required files and
permissions, and absent things that must stay absent (for example setuid binaries in
core).

## Smoke test

`tests/smoke.sh <image-ref>` is optional and executable; use it when behavior needs a
running container (a service answering, a shell login, Docker access). CI exports
`DISTRO`, `TIER`, and `VARIANT` and provides the Docker socket at
`/var/run/docker.sock`. Exit non-zero on failure; clean up containers you start.

Follow the repository shell style (`#!/usr/bin/env bash`, `set -euo pipefail`, shfmt,
shellcheck-clean). Never run it locally in this repository's agent sessions unless the
user authorizes running containers.

## Scan gate

CI scans every variant on both architectures with Trivy. The full report (every severity
and package type) goes to code scanning as SARIF. The gate fails only on what a rebuild
of this repository can fix: HIGH or CRITICAL OS-package vulnerabilities with a released
fix (bump `OS_REFRESH`), except those accepted in `tools/trivyignore.yaml`, and secrets
outside the vendored directories `/usr/local/lib/node_modules`, `/usr/local/go`, and
`/opt`. Vulnerabilities inside upstream binaries only get fixes from a new upstream
release, which Renovate bumps, so they are reported but never block a publish.
