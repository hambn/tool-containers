# Docker run recipes

Use shell scripts for plain Docker runs.

| File | Use |
|------|-----|
| `run.sh` | normal run from the published image |
| `airgapped.run.sh` | load a saved image tar and run without pulling |
| `README.md` | file map, commands, and offline preparation |

## Script rules

- Start with `#!/usr/bin/env bash` and `set -euo pipefail`.
- Assert required runtime environment variables before starting the container.
- Mount `"$PWD:/workspace"`; use `-it --rm` for interactive tools and pass `"$@"` through.
- Reference `ghcr.io/<owner>/<tool>:latest` for normal runs.
- Keep scripts executable.

## Air-gapped pattern

On a connected host, run `docker save ghcr.io/<owner>/<tool>:latest -o <tool>.tar` and
copy the tar to the offline host. The offline script should accept the tar path as `$1`
(defaulting to `<tool>.tar`), run `docker load -i`, then use `--pull=never`.
