# core · Docker

Open a shell in the hardened [core](../../README.md) base, or use it as the `FROM` line of
your own image.

## Prerequisites

- Docker 24 or later

## Commands

Open a throwaway shell with the current directory mounted at `/workspace`:

```bash
./run.sh
```

Run a single command instead of a shell:

```bash
./run.sh curl -fsS https://example.com -o /dev/null -w '%{http_code}\n'
```

Build your own image on top of core with [`Dockerfile.example`](./Dockerfile.example); it
expects an `app.sh` next to it:

```bash
docker build -f Dockerfile.example -t my-app .
docker run --rm my-app
```

## Variables

| Variable | Default | Purpose |
|---|---|---|
| `CORE_VARIANT` | `wolfi` | Image variant: `wolfi`, `alpine`, or `ubuntu` |

## Workspace

[`run.sh`](./run.sh) bind-mounts the current directory at `/workspace`. The container runs
as `nonroot` (UID/GID 65532), so the directory must be readable, and writable if the
command writes, by that UID.

## Files

- [`run.sh`](./run.sh) — interactive shell or one-off command
- [`Dockerfile.example`](./Dockerfile.example) — minimal derived image

## Cleanup

`run.sh` uses `--rm`. Remove derived images with `docker image rm my-app`.

## Limitations

- No `sudo` and no setuid binaries: install packages in a derived image as `USER root`,
  then switch back to `USER 65532:65532`.
