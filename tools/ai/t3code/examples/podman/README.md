# t3code · Podman

T3 Code is a web GUI for coding agents, served from a container on port 3773. This page runs it on Podman with copy-paste examples; every file in this directory is shown below exactly as it exists in the repository.

See the [tool overview](../../README.md) for image variants, tags, and registries.

## Requirements

- Docker or a compatible runtime

## Quick start

```bash
podman run -it --rm --userns=keep-id:uid=1000,gid=1000 \
  -p 127.0.0.1:3773:3773 \
  -v "$PWD:/workspace:Z" \
  ghcr.io/hambn/t3code:ubuntu-browser
```

## Files in this directory

### `run.sh`

```bash
#!/usr/bin/env bash
# Rootless podman. :Z relabels the volume for SELinux hosts. GUI at http://localhost:3773
# Auth the agent from inside the T3 Code UI — no API key needed here.
set -euo pipefail

podman run -it --rm --userns=keep-id:uid=1000,gid=1000 \
  -p 127.0.0.1:3773:3773 \
  -v "$PWD:/workspace:Z" \
  ghcr.io/hambn/t3code:ubuntu-browser "$@"
```

## More examples

Run it as a systemd user service (quadlet)

Save as `~/.config/containers/systemd/t3code.container`, then run `systemctl --user daemon-reload && systemctl --user start t3code`:

```ini
[Unit]
Description=t3code container

[Container]
AutoUpdate=registry
Image=ghcr.io/hambn/t3code:ubuntu-browser
PublishPort=127.0.0.1:3773:3773
Volume=%h/workspace:/workspace:Z

[Service]
Restart=on-failure

[Install]
WantedBy=default.target
```

### Rootless with SELinux labeling

`:Z` relabels the bind mount for container use on SELinux hosts; drop it on non-SELinux systems if you prefer.
