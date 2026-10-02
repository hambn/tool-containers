---
name: Docker compose
description: Run the Open Code Review CLI as a Docker compose service on a host checkout you choose, with a second Compose file for hosts that cannot pull.
usecase: Repeatable local reviews
keywords: [ocr review, llm provider, air-gapped]
---

# Run Open Code Review with Docker compose

The `open-code-review` service runs [Open Code Review](../../README.md) on the directory
in `WORKSPACE`. [`compose.sh`](./compose.sh) checks that `WORKSPACE` is an absolute
path, because Compose would resolve a relative one against this directory, then runs
`docker compose` here.

## Prerequisites

- Docker Engine with the Compose v2 plugin.
- An API key for an LLM provider `ocr` supports, such as `ANTHROPIC_API_KEY`.

## Review your changes

The Compose files pass no environment, and `ocr` keeps its provider settings in
`/home/sysadmin/.opencodereview/config.json` inside the container, which `--rm`
removes. Start a shell with your key, then configure and review in it:

```bash
export ANTHROPIC_API_KEY=sk-ant-...
WORKSPACE="$PWD" ./compose.sh run --rm -e ANTHROPIC_API_KEY \
  --entrypoint zsh open-code-review
```

```bash
ocr config set provider anthropic
ocr config set model <model>
ocr review
```

Arguments after the service name go to `ocr`, so
`WORKSPACE="$PWD" ./compose.sh run --rm open-code-review --help` works without a
provider.

## Run without registry access

On a connected machine, run
`docker save ghcr.io/hambn/open-code-review:ubuntu-browser -o open-code-review.tar`.
On the offline host, load it and use the air-gapped file, which sets
`pull_policy: never`:

```bash
docker load -i open-code-review.tar
WORKSPACE="$PWD" ./compose.sh -f airgapped.docker-compose.yml run --rm \
  -e ANTHROPIC_API_KEY --entrypoint zsh open-code-review
```

The review itself still needs network access to your LLM provider.

## Variables

| Variable | Required | Purpose |
|---|---|---|
| `WORKSPACE` | yes | Absolute host path mounted at `/workspace`. |
| `OPEN_CODE_REVIEW_IMAGE` | no | Image for both Compose files. Defaults to `ghcr.io/hambn/open-code-review:ubuntu-browser`; set a digest reference to pin one build. |

## Workspace

`WORKSPACE` is mounted at `/workspace` and must be a Git repository for `ocr review`.
`ocr` runs as UID 1000.

## Files

- [`compose.sh`](./compose.sh) validates `WORKSPACE` and passes its arguments to `docker compose`.
- [`docker-compose.yml`](./docker-compose.yml) runs the published image.
- [`airgapped.docker-compose.yml`](./airgapped.docker-compose.yml) runs a loaded image and never pulls.
