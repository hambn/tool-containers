# docker

Plain `docker run` usage.

| File | Use |
|------|-----|
| `run.sh` | normal run, pulls image from registry |
| `airgapped.run.sh` | offline host: load image from a `.tar` first, no pull |

Needs `ANTHROPIC_API_KEY` in env. Mounts current dir at `/workspace`.

```sh
ANTHROPIC_API_KEY=sk-... ./run.sh
```

Airgapped: on an online host run `docker save ghcr.io/hambn/claude-code:latest -o claude-code.tar`, copy the tar over, then `./airgapped.run.sh`.
