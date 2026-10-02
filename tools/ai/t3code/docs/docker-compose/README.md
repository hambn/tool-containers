---
name: Docker compose
description: Serve the T3 Code web GUI on 127.0.0.1:3773 as a Docker compose service that keeps its state until you remove it, with an air-gapped Compose file.
usecase: Persistent local instance
keywords: [web gui, port 3773, air-gapped]
---

# Run T3 Code with Docker compose

The `t3code` service serves [T3 Code](../../README.md) on `http://127.0.0.1:3773` with
the directory in `WORKSPACE` mounted at `/workspace`. [`compose.sh`](./compose.sh)
checks that `WORKSPACE` is an absolute path, because Compose would resolve a relative
one against this directory, then runs `docker compose` here.

## Prerequisites

- Docker Engine with the Compose v2 plugin.

## Run T3 Code

```bash
WORKSPACE="$PWD" ./compose.sh up -d
WORKSPACE="$PWD" ./compose.sh logs t3code | grep Token:
```

Open `http://127.0.0.1:3773/pair#token=<token>` to pair your browser, then add
`/workspace` as a project and sign in to an agent from the UI. The token expires after
five minutes; for a new pair URL, run:

```bash
WORKSPACE="$PWD" ./compose.sh exec t3code t3 auth pairing create --base-url http://127.0.0.1:3773
```

`./compose.sh stop` and `./compose.sh start` keep the container, so T3 Code's state and
the agent logins survive. Each start prints a new token. `./compose.sh down` removes
the container and that state. The service has no restart policy, so it does not start
again after a host reboot until you run `up` or `start`.

## Run without registry access

On a connected machine, run `docker save ghcr.io/hambn/t3code:ubuntu-browser -o t3code.tar`.
On the offline host, load it and use the air-gapped file, which sets
`pull_policy: never`:

```bash
docker load -i t3code.tar
WORKSPACE="$PWD" ./compose.sh -f airgapped.docker-compose.yml up -d
```

## Variables

| Variable | Required | Purpose |
|---|---|---|
| `WORKSPACE` | yes | Absolute host path mounted at `/workspace`. |
| `T3CODE_IMAGE` | no | Image for both Compose files. Defaults to `ghcr.io/hambn/t3code:ubuntu-browser`; set a digest reference to pin one build. |

## Workspace

`WORKSPACE` is mounted at `/workspace`. T3 Code runs as UID 1000, so new files belong
to UID 1000 on the host. The port is bound to `127.0.0.1`; put an authenticating
reverse proxy in front before you expose it further.

## Files

- [`compose.sh`](./compose.sh) validates `WORKSPACE` and passes its arguments to `docker compose`.
- [`docker-compose.yml`](./docker-compose.yml) runs the published image.
- [`airgapped.docker-compose.yml`](./airgapped.docker-compose.yml) runs a loaded image and never pulls.
