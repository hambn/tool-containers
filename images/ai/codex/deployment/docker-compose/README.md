# Docker Compose

Run Codex against the current directory:

```sh
WORKSPACE="$PWD" ./compose.sh run --rm codex
WORKSPACE="$PWD" CODEX_IMAGE=ghcr.io/hambn/codex:alpine \
  ./compose.sh run --rm codex --help
```

`compose.sh` rejects a missing or relative `WORKSPACE` before invoking Compose. Set
`OPENAI_API_KEY` in the host environment. The air-gapped definition builds the
Ubuntu browser variant locally and requires its `agentimg` base and npm dependencies
to be cached or reachable:

```sh
WORKSPACE="$PWD" ./compose.sh -f airgapped.docker-compose.yml run --build --rm codex
```
