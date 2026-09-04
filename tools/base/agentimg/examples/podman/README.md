# agentimg · Podman

agentimg is the base image family (Ubuntu and Alpine, with optional headless Chromium) the tool images build on. This page runs it on Podman with copy-paste examples; every file in this directory is shown below exactly as it exists in the repository.

See the [tool overview](../../README.md) for image variants, tags, and registries.

## Requirements

- Docker or a compatible runtime

## Quick start

```bash
podman run -it --rm --userns=keep-id:uid=1000,gid=1000 \
  -v "$PWD:/workspace:Z" \
  ghcr.io/hambn/agentimg:latest zsh
```

## Files in this directory

### `run.sh`

```bash
#!/usr/bin/env bash
# Open a rootless agentimg shell; :Z supports SELinux hosts.
set -euo pipefail

IMAGE="${AGENTIMG_IMAGE:-ghcr.io/hambn/agentimg:latest}"
podman run -it --rm --userns=keep-id:uid=1000,gid=1000 --user 1000:1000 \
  -v "$PWD:/workspace:Z" \
  "$IMAGE" zsh "$@"
```

## More examples

Run it as a systemd user service (quadlet)

Save as `~/.config/containers/systemd/agentimg.container`, then run `systemctl --user daemon-reload && systemctl --user start agentimg`:

```ini
[Unit]
Description=agentimg container

[Container]
AutoUpdate=registry
Image=ghcr.io/hambn/agentimg:latest
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
