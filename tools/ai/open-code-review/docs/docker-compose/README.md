---
name: Docker Compose
description: Run the Open Code Review CLI (ocr) as a Docker Compose service against the current checkout, with an air-gapped compose file.
usecase: Repeatable local reviews
keywords: [ocr review, llm provider, air-gapped]
---

# open-code-review · Docker Compose

The `open-code-review` service runs the Open Code Review CLI (`ocr`) with the arguments you pass, for example `review`. [`compose.sh`](./compose.sh) checks that `WORKSPACE` is an absolute path and runs `docker compose` from this directory.

See the [tool overview](../../README.md) for image variants, tags, and registries.

## Prerequisites

- Docker Engine with the Compose v2 plugin.
- Configure an LLM provider with `ocr config` or its supported environment variables, passed with `-e <VAR>` after `./compose.sh run --rm`.

## Commands

```bash
WORKSPACE="$PWD" ./compose.sh run --rm open-code-review
```

Air-gapped host, after `docker load -i open-code-review.tar`:

```bash
WORKSPACE="$PWD" ./compose.sh -f airgapped.docker-compose.yml run --rm open-code-review
```

## Variables

| Variable | Required | Purpose |
|---|---|---|
| `WORKSPACE` | yes | Absolute host path mounted at `/workspace`. |
| `OPEN_CODE_REVIEW_IMAGE` | no | Image for both Compose files; defaults to `ghcr.io/hambn/open-code-review:ubuntu-browser`. |

## Workspace

`WORKSPACE` is bind-mounted at `/workspace`; the container runs as UID 1000.

## Files

- [`compose.sh`](./compose.sh) — validates `WORKSPACE`, then forwards arguments to `docker compose`.
- [`docker-compose.yml`](./docker-compose.yml) — pulls the published image.
- [`airgapped.docker-compose.yml`](./airgapped.docker-compose.yml) — uses a pre-loaded image with `pull_policy: never`.

## Cleanup

```bash
WORKSPACE="$PWD" ./compose.sh down
```

## Limitations

- Moving tags such as `ubuntu-browser` are repointed on every rebuild; pin a digest (`ghcr.io/hambn/open-code-review@sha256:<digest>`) for repeatable runs.
