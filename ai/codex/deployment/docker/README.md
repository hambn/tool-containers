# Docker

Run Codex against the current directory with the primary browser-enabled image:

```sh
./run.sh
CODEX_IMAGE=ghcr.io/hambn/codex:alpine ./run.sh --help
```

Set `OPENAI_API_KEY` in the host environment before running. For an offline host,
save `ghcr.io/hambn/codex:latest` on a connected host, copy the tar beside
`airgapped.run.sh`, and run that script.
