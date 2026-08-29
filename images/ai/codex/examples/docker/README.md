# codex · Docker

Codex is OpenAI's coding agent CLI, packaged on the agentimg foundations. This page runs it on Docker with copy-paste examples; every file in this directory is shown below exactly as it exists in the repository.

See the [tool overview](../../README.md) for image variants, tags, and registries.

## Requirements

- Docker or a compatible runtime
- `OPENAI_API_KEY` set in your environment (never baked into the image)

## Quick start

```bash
docker run -it --rm \
  -e OPENAI_API_KEY \
  -v "$PWD:/workspace" \
  ghcr.io/hambn/codex:latest codex
```

## Files in this directory

### `run.sh`

```bash
#!/usr/bin/env bash
# Run Codex against the current directory.
set -euo pipefail

: "${OPENAI_API_KEY:?set OPENAI_API_KEY}"
IMAGE="${CODEX_IMAGE:-ghcr.io/hambn/codex:latest}"
docker run -it --rm \
  -e OPENAI_API_KEY \
  -v "$PWD:/workspace" \
  "$IMAGE" "$@"
```

### `airgapped.run.sh`

```bash
#!/usr/bin/env bash
# Offline host. Load Codex from a local tar and never pull.
set -euo pipefail

: "${OPENAI_API_KEY:?set OPENAI_API_KEY}"
TAR="${1:-codex.tar}"
shift $(( $# > 0 ? 1 : 0 ))
[ -f "$TAR" ] || { echo "missing $TAR" >&2; exit 1; }
docker load -i "$TAR"
docker run -it --rm --pull=never \
  -e OPENAI_API_KEY \
  -v "$PWD:/workspace" \
  ghcr.io/hambn/codex:latest "$@"
```

## More examples

### Pin a specific image tag

Every moving tag from the [image table](../../README.md#images) works; override with an environment variable:

```bash
CODEX_IMAGE=ghcr.io/hambn/codex:<tag> ./run.sh


### Pass the API key without exporting it

```bash
docker run -it --rm \
  -e OPENAI_API_KEY \
  -v "$PWD:/workspace" \
  ghcr.io/hambn/codex:latest codex


### One-off non-interactive command

```bash
docker run --rm \
  -e OPENAI_API_KEY \
  -v "$PWD:/workspace" \
  ghcr.io/hambn/codex:latest codex --version


### Constrain resources

```bash
docker run -it --rm \
  --cpus=2 \
  --memory=4g \
  --memory-swap=4g \
  -v "$PWD:/workspace" \
  ghcr.io/hambn/codex:latest codex
