# agentbloat · Podman

agentbloat bundles the current Codex, Claude Code, Cursor, Grok, OpenCode, Copilot, Gemini, ACP Registry, and Pi coding-agent CLIs in one image. This page runs it on Podman with copy-paste examples; every file in this directory is shown below exactly as it exists in the repository.

See the [tool overview](../../README.md) for image variants, tags, and registries.

## Requirements

- Docker or a compatible runtime

## Quick start

```bash
podman run -it --rm --userns=keep-id:uid=1000,gid=1000 \
  -v "$PWD:/workspace:Z" \
  ghcr.io/hambn/agentbloat:latest zsh
```

## Files in this directory

### `run.sh`

```bash
#!/usr/bin/env bash
# Open a rootless agentbloat shell; :Z supports SELinux hosts.
set -euo pipefail

IMAGE="${AGENTBLOAT_IMAGE:-ghcr.io/hambn/agentbloat:latest}"
podman run -it --rm --userns=keep-id:uid=1000,gid=1000 \
  -v "$PWD:/workspace:Z" \
  "$IMAGE" zsh "$@"
```

## More examples

Run it as a systemd user service (quadlet)

Save as `~/.config/containers/systemd/agentbloat.container`, then run `systemctl --user daemon-reload && systemctl --user start agentbloat`:

```ini
[Unit]
Description=agentbloat container

[Container]
AutoUpdate=registry
Image=ghcr.io/hambn/agentbloat:latest
Volume=%h/workspace:/workspace:Z
Exec=zsh
Interactive=true
[Service]
Restart=on-failure

[Install]
WantedBy=default.target
```

### Rootless with SELinux labeling

`:Z` relabels the bind mount for container use on SELinux hosts; drop it on non-SELinux systems if you prefer.
