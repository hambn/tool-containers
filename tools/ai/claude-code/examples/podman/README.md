# claude-code · Podman

Claude Code is Anthropic's coding agent CLI, packaged to run in a container. This page runs it on Podman with copy-paste examples; every file in this directory is shown below exactly as it exists in the repository.

See the [tool overview](../../README.md) for image variants, tags, and registries.

## Requirements

- Docker or a compatible runtime
- `ANTHROPIC_API_KEY` set in your environment (never baked into the image)

## Quick start

```bash
podman run -it --rm --userns=keep-id:uid=1000,gid=1000 \
  -e ANTHROPIC_API_KEY \
  -v "$PWD:/workspace:Z" \
  ghcr.io/hambn/claude-code:latest claude
```

## Files in this directory

### `run.sh`

```bash
#!/usr/bin/env bash
# Rootless podman. :Z relabels the volume for SELinux hosts.
set -euo pipefail
: "${ANTHROPIC_API_KEY:?set ANTHROPIC_API_KEY}"

podman run -it --rm --userns=keep-id:uid=1000,gid=1000 \
  -e ANTHROPIC_API_KEY \
  -v "$PWD:/workspace:Z" \
  ghcr.io/hambn/claude-code:latest "$@"
```

## More examples

Run it as a systemd user service (quadlet)

Save as `~/.config/containers/systemd/claude-code.container`, then run `systemctl --user daemon-reload && systemctl --user start claude-code`:

```ini
[Unit]
Description=claude-code container

[Container]
AutoUpdate=registry
Image=ghcr.io/hambn/claude-code:latest
Volume=%h/workspace:/workspace:Z
Exec=claude
Interactive=true
[Service]
Restart=on-failure

[Install]
WantedBy=default.target
```

### Rootless with SELinux labeling

`:Z` relabels the bind mount for container use on SELinux hosts; drop it on non-SELinux systems if you prefer.
