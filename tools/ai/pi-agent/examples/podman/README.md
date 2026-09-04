# pi-agent · Podman

Pi is a coding agent from Earendil Works, packaged on the agentimg foundations. This page runs it on Podman with copy-paste examples; every file in this directory is shown below exactly as it exists in the repository.

See the [tool overview](../../README.md) for image variants, tags, and registries.

## Requirements

- Docker or a compatible runtime

## Quick start

```bash
podman run -it --rm --userns=keep-id:uid=1000,gid=1000 \
  -v "$PWD:/workspace:Z" \
  ghcr.io/hambn/pi-agent:latest
```

## Files in this directory

### `run.sh`

```bash
#!/usr/bin/env bash
# Run Pi rootlessly against the current directory; :Z supports SELinux hosts.
set -euo pipefail

IMAGE="${PI_AGENT_IMAGE:-ghcr.io/hambn/pi-agent:latest}"
podman run -it --rm --userns=keep-id:uid=1000,gid=1000 \
  -v "$PWD:/workspace:Z" \
  "$IMAGE" "$@"
```

## More examples

Run it as a systemd user service (quadlet)

Save as `~/.config/containers/systemd/pi-agent.container`, then run `systemctl --user daemon-reload && systemctl --user start pi-agent`:

```ini
[Unit]
Description=pi-agent container

[Container]
AutoUpdate=registry
Image=ghcr.io/hambn/pi-agent:latest
Volume=%h/workspace:/workspace:Z

[Service]
Restart=on-failure

[Install]
WantedBy=default.target
```

### Rootless with SELinux labeling

`:Z` relabels the bind mount for container use on SELinux hosts; drop it on non-SELinux systems if you prefer.
