# codex · Podman

Codex is OpenAI's coding agent CLI, packaged on the agentimg foundations. This page runs it on Podman with copy-paste examples; every file in this directory is shown below exactly as it exists in the repository.

See the [tool overview](../../README.md) for image variants, tags, and registries.

## Requirements

- Docker or a compatible runtime
- `OPENAI_API_KEY` set in your environment (never baked into the image)

## Quick start

```bash
podman run -it --rm --userns=keep-id:uid=1000,gid=1000 \
  -e OPENAI_API_KEY \
  -v "$PWD:/workspace:Z" \
  ghcr.io/hambn/codex:latest codex
```

## Files in this directory

### `run.sh`

```bash
#!/usr/bin/env bash
# Run Codex rootlessly against the current directory; :Z supports SELinux hosts.
set -euo pipefail

: "${OPENAI_API_KEY:?set OPENAI_API_KEY}"
IMAGE="${CODEX_IMAGE:-ghcr.io/hambn/codex:latest}"
podman run -it --rm --userns=keep-id:uid=1000,gid=1000 \
  -e OPENAI_API_KEY \
  -v "$PWD:/workspace:Z" \
  "$IMAGE" "$@"
```

## More examples

Run it as a systemd user service (quadlet)

Save as `~/.config/containers/systemd/codex.container`, then run `systemctl --user daemon-reload && systemctl --user start codex`:

```ini
[Unit]
Description=codex container

[Container]
AutoUpdate=registry
Image=ghcr.io/hambn/codex:latest
Volume=%h/workspace:/workspace:Z
Exec=codex
Interactive=true
[Service]
Restart=on-failure

[Install]
WantedBy=default.target
```

### Rootless with SELinux labeling

`:Z` relabels the bind mount for container use on SELinux hosts; drop it on non-SELinux systems if you prefer.
