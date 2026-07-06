# docker

Plain `docker run` usage. Serves the T3 Code web GUI at `http://localhost:3773`.

| File | Use |
|------|-----|
| `run.sh` | normal run, pulls image from registry |
| `airgapped.run.sh` | offline host: load image from a `.tar` first, no pull |

Mounts the current dir at `/workspace` and publishes port `3773`. Auth the agent you want
(`ANTHROPIC_API_KEY` for Claude, `OPENAI_API_KEY` for Codex) or log in from the UI.

```sh
ANTHROPIC_API_KEY=sk-... ./run.sh
# then open http://localhost:3773
```

Airgapped: on an online host run `docker save ghcr.io/hambn/t3code:node-slim-agents -o t3code.tar`,
copy the tar over, then `./airgapped.run.sh`.
