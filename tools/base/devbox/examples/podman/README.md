# devbox · Podman

Run [devbox](../../README.md) rootless with your host UID mapped to `sysadmin`.

## Prerequisites

- Podman 4.3 or later (for `--userns=keep-id:uid=…,gid=…`)

## Commands

Interactive shell on the current directory:

```bash
./run.sh
```

Long-running user service with Quadlet, then attach a shell:

```bash
mkdir -p ~/.config/containers/systemd ~/workspace
cp devbox.container ~/.config/containers/systemd/
systemctl --user daemon-reload
systemctl --user start devbox
podman exec -it systemd-devbox zsh -l
```

## Variables

| Variable | Default | Purpose |
|---|---|---|
| `DEVBOX_VARIANT` | `ubuntu-full` | Any variant from the [image table](../../README.md#images) |

## Workspace

The workspace is mounted at `/workspace` with `:Z` so SELinux hosts relabel it; your host
UID maps to `sysadmin` (1000), so files keep your ownership.

## Files

- [`run.sh`](./run.sh) — rootless interactive shell
- [`devbox.container`](./devbox.container) — Quadlet unit for a long-running container

## Cleanup

```bash
systemctl --user stop devbox
rm ~/.config/containers/systemd/devbox.container
systemctl --user daemon-reload
```

## Limitations

- `sudo` works inside the user namespace only; it cannot gain host privileges.
