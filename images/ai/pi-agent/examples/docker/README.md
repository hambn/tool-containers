# pi-agent · Docker

Pi is a coding agent from Earendil Works, packaged on the agentimg foundations. This page runs it on Docker with copy-paste examples; every file in this directory is shown below exactly as it exists in the repository.

See the [tool overview](../../README.md) for image variants, tags, and registries.

## Requirements

- Docker or a compatible runtime

## Quick start

```bash
docker run -it --rm \
  -v "$PWD:/workspace" \
  ghcr.io/hambn/pi-agent:latest
```

## Files in this directory

### `run.sh`

```bash
#!/usr/bin/env bash
# Run Pi against the current directory.
set -euo pipefail

IMAGE="${PI_AGENT_IMAGE:-ghcr.io/hambn/pi-agent:latest}"
docker run -it --rm \
  -v "$PWD:/workspace" \
  "$IMAGE" "$@"
```

### `airgapped.run.sh`

```bash
#!/usr/bin/env bash
# Offline host. Load Pi from a local tar and never pull.
set -euo pipefail

TAR="${1:-pi-agent.tar}"
shift $(( $# > 0 ? 1 : 0 ))
[ -f "$TAR" ] || { echo "missing $TAR" >&2; exit 1; }
docker load -i "$TAR"
docker run -it --rm --pull=never \
  -v "$PWD:/workspace" \
  ghcr.io/hambn/pi-agent:latest "$@"
```

## More examples

### Pin a specific image tag

Every moving tag from the [image table](../../README.md#images) works; override with an environment variable:

```bash
PI_AGENT_IMAGE=ghcr.io/hambn/pi-agent:<tag> ./run.sh
```

### One-off non-interactive command

```bash
docker run --rm -v "$PWD:/workspace" ghcr.io/hambn/pi-agent:latest --help
```

### Constrain resources

```bash
docker run -it --rm \
  --cpus=2 \
  --memory=4g \
  --memory-swap=4g \
  -v "$PWD:/workspace" \
  ghcr.io/hambn/pi-agent:latest
```
