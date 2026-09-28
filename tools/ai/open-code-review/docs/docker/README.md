---
name: Docker
description: Review the current checkout with the Open Code Review CLI in Docker, or run it from a saved image tarball on a host with no registry access.
usecase: Review the current checkout
keywords: [ocr review, llm provider, air-gapped]
---

# Run Open Code Review with Docker

[`run.sh`](./run.sh) runs [Open Code Review](../../README.md) on the current directory,
passing any arguments to `ocr`. [`airgapped.run.sh`](./airgapped.run.sh) does the same
from a saved image on a host that cannot pull.

## Prerequisites

- Docker Engine 23 or later.
- An API key for an LLM provider `ocr` supports, such as `ANTHROPIC_API_KEY` or
  `OPENAI_API_KEY`.

## Review your changes

`ocr` needs a provider and model before it can review. It saves them in
`/home/sysadmin/.opencodereview/config.json`, which `--rm` deletes when the container
exits, so configure and review in the same container. Start a shell in the image with
your key and the checkout:

```bash
docker run -it --rm -e ANTHROPIC_API_KEY -v "$PWD:/workspace" \
  --entrypoint zsh ghcr.io/hambn/open-code-review:ubuntu-browser
```

Then, inside it:

```bash
ocr config set provider anthropic
ocr config set model <model>
ocr review                      # staged, unstaged, and untracked changes
ocr review --from main --to HEAD
```

`./run.sh <args>` suits commands that need no saved settings, such as `./run.sh --help`.
See the upstream [configuration reference](https://github.com/alibaba/open-code-review/blob/main/pages/src/content/docs/en/configuration.md)
for other providers and their variables.

## Run without registry access

On a machine that can pull, save the image:

```bash
docker save ghcr.io/hambn/open-code-review:ubuntu-browser -o open-code-review.tar
```

Copy the tar to the offline host and pass its path first; the remaining arguments go to
`ocr`:

```bash
./airgapped.run.sh open-code-review.tar --help
```

The script loads the tar and runs `OPEN_CODE_REVIEW_IMAGE` with `--pull=never`. After
it has loaded the image once, start a shell as shown above with `--pull=never` added.
A review still needs network access to your LLM provider.

## Variables

| Variable | Required | Purpose |
|---|---|---|
| `OPEN_CODE_REVIEW_IMAGE` | no | Image both scripts run. Defaults to `ghcr.io/hambn/open-code-review:ubuntu-browser`; set `ghcr.io/hambn/open-code-review@sha256:<digest>` to pin one build. |

## Workspace

The current directory is mounted at `/workspace`, the image's working directory. `ocr`
runs as `sysadmin` (UID 1000); the checkout must be a Git repository for `ocr review`.

## Files

- [`run.sh`](./run.sh) pulls the image if needed and runs `ocr` with your arguments.
- [`airgapped.run.sh`](./airgapped.run.sh) loads a saved tar and runs it without pulling.
