# claude-code · Docker

Claude Code is Anthropic's coding agent CLI, packaged to run in a container. This page runs it on Docker with copy-paste examples; every file in this directory is shown below exactly as it exists in the repository.

See the [tool overview](../../README.md) for image variants, tags, and registries.

## Requirements

- Docker or a compatible runtime
- `ANTHROPIC_API_KEY` set in your environment (never baked into the image)

## Quick start

```bash
docker run -it --rm \
  -e ANTHROPIC_API_KEY \
  -v "$PWD:/workspace" \
  ghcr.io/hambn/claude-code:latest claude
```

## Files in this directory

### `run.sh`

```bash
#!/usr/bin/env bash
# Run Claude Code on the current directory.
set -euo pipefail
: "${ANTHROPIC_API_KEY:?set ANTHROPIC_API_KEY}"

docker run -it --rm \
  -e ANTHROPIC_API_KEY \
  -v "$PWD:/workspace" \
  ghcr.io/hambn/claude-code:latest "$@"
```

### `airgapped.run.sh`

```bash
#!/usr/bin/env bash
# Offline host. Loads image from a local tar, never pulls.
# Prep on an online host: docker save ghcr.io/hambn/claude-code:latest -o claude-code.tar
set -euo pipefail
: "${ANTHROPIC_API_KEY:?set ANTHROPIC_API_KEY}"

TAR="${1:-claude-code.tar}"
if [ "$#" -gt 0 ]; then shift; fi
[ -f "$TAR" ] || { echo "missing $TAR — docker save it on an online host first" >&2; exit 1; }

docker load -i "$TAR"
docker run -it --rm \
  --pull=never \
  -e ANTHROPIC_API_KEY \
  -v "$PWD:/workspace" \
  ghcr.io/hambn/claude-code:latest "$@"
```

## More examples

### Pin a specific image tag

Edit `run.sh` (or copy it) and replace the image reference with any moving tag from the [image table](../../README.md#images):

```bash
docker run -it --rm -v "$PWD:/workspace" ghcr.io/hambn/claude-code:<tag>


### Pass the API key without exporting it

```bash
docker run -it --rm \
  -e ANTHROPIC_API_KEY \
  -v "$PWD:/workspace" \
  ghcr.io/hambn/claude-code:latest claude


### One-off non-interactive command

```bash
docker run --rm \
  -e ANTHROPIC_API_KEY \
  -v "$PWD:/workspace" \
  ghcr.io/hambn/claude-code:latest claude --version


### Constrain resources

```bash
docker run -it --rm \
  --cpus=2 \
  --memory=4g \
  --memory-swap=4g \
  -v "$PWD:/workspace" \
  ghcr.io/hambn/claude-code:latest claude
