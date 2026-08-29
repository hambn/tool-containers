# agentbloat · Docker

agentbloat bundles the current Codex, Claude Code, Cursor, Grok, OpenCode, Copilot, Gemini, ACP Registry, and Pi coding-agent CLIs in one image. This page runs it on Docker with copy-paste examples; every file in this directory is shown below exactly as it exists in the repository.

See the [tool overview](../../README.md) for image variants, tags, and registries.

## Requirements

- Docker or a compatible runtime

## Quick start

```bash
docker run -it --rm \
  -v "$PWD:/workspace" \
  ghcr.io/hambn/agentbloat:latest zsh
```

## Files in this directory

### `run.sh`

```bash
#!/usr/bin/env bash
# Run an interactive agentbloat shell on the current directory.
set -euo pipefail

IMAGE="${AGENTBLOAT_IMAGE:-ghcr.io/hambn/agentbloat:latest}"
docker_options=()
if [[ -n "${AGENTBLOAT_DOCKER_SOCKET:-}" ]]; then
  [[ -S "$AGENTBLOAT_DOCKER_SOCKET" ]] || {
    echo "not a Docker socket: $AGENTBLOAT_DOCKER_SOCKET" >&2
    exit 1
  }
  docker_options+=(
    --volume "$AGENTBLOAT_DOCKER_SOCKET:/var/run/docker.sock"
    --group-add "$(stat -c %g "$AGENTBLOAT_DOCKER_SOCKET")"
  )
fi

docker run -it --rm \
  "${docker_options[@]}" \
  -v "$PWD:/workspace" \
  "$IMAGE" zsh "$@"
```

### `airgapped.run.sh`

```bash
#!/usr/bin/env bash
# Offline host. Load agentbloat from a local tar and never pull.
set -euo pipefail

TAR="${1:-agentbloat.tar}"
if [ "$#" -gt 0 ]; then shift; fi
[ -f "$TAR" ] || { echo "missing $TAR" >&2; exit 1; }
docker load -i "$TAR"
docker run -it --rm --pull=never \
  -v "$PWD:/workspace" \
  ghcr.io/hambn/agentbloat:latest bash "$@"
```

## More examples

### Pin a specific image tag

Every moving tag from the [image table](../../README.md#images) works; override with an environment variable:

```bash
AGENTBLOAT_IMAGE=ghcr.io/hambn/agentbloat:<tag> ./run.sh


### One-off non-interactive command

```bash
docker run --rm -v "$PWD:/workspace" ghcr.io/hambn/agentbloat:latest zsh -c 'exit'


### Give the container access to the Docker socket

The helpers mount the host socket only when you ask for it:

```bash
AGENTBLOAT_DOCKER_SOCKET=/var/run/docker.sock ./run.sh


### Constrain resources

```bash
docker run -it --rm \
  --cpus=2 \
  --memory=4g \
  --memory-swap=4g \
  -v "$PWD:/workspace" \
  ghcr.io/hambn/agentbloat:latest zsh
