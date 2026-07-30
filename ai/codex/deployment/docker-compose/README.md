# Docker Compose

Run Codex against the current directory:

```sh
docker compose run --rm codex
CODEX_IMAGE=ghcr.io/hambn/codex:alpine docker compose run --rm codex --help
```

Set `OPENAI_API_KEY` in the host environment. The air-gapped definition builds the
Ubuntu browser variant locally and requires its `agentimg` base and npm dependencies
to be cached or reachable.
