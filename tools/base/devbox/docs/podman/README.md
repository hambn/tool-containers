---
name: Podman
description: Run devbox under rootless Podman with your UID mapped to sysadmin, interactively or as a Quadlet systemd user service.
usecase: Rootless development shell or Quadlet service
keywords: [rootless, quadlet, systemd user service, keep-id]
---

# Run devbox with Podman

[`run.sh`](./run.sh) opens a rootless [devbox](../../README.md) shell on the current
directory. [`devbox.container`](./devbox.container) runs the same image as a Quadlet
systemd user service that you open shells in.

## Prerequisites

- Podman 4.3 or later for `run.sh`, which uses `--userns=keep-id:uid=1000,gid=1000`.
- Podman 4.4 or later for the Quadlet service.

## Open a shell

```bash
./run.sh
```

## Run as a user service

The service mounts `~/workspace` and keeps the container running with `sleep infinity`:

```bash
mkdir -p ~/.config/containers/systemd ~/workspace
cp devbox.container ~/.config/containers/systemd/
systemctl --user daemon-reload
systemctl --user start devbox
podman exec -it systemd-devbox zsh -l
```

`AutoUpdate=registry` lets `podman auto-update` pull a newer image and restart the
service.

## Variables

| Variable | Required | Purpose |
|---|---|---|
| `DEVBOX_IMAGE` | no | Image `run.sh` runs. Defaults to `ghcr.io/hambn/devbox:ubuntu-full`; use any [variant](../../README.md#images), or a digest reference to pin one build. Edit `Image=` in the unit for the service. |

## Workspace

The workspace is mounted at `/workspace` with `:Z`, which relabels it on SELinux hosts.
Your host UID maps to `sysadmin`, so files keep your ownership. `sudo` works inside the
user namespace but gives no privileges on the host.

## Files

- [`run.sh`](./run.sh) opens a rootless shell on the current directory.
- [`devbox.container`](./devbox.container) is the Quadlet unit for the user service.

## Cleanup

```bash
systemctl --user stop devbox
rm ~/.config/containers/systemd/devbox.container
systemctl --user daemon-reload
```
