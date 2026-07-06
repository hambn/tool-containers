# docker

Plain `docker run` usage. Serves the T3 Code web GUI at `http://localhost:3773`.

| File | Use |
|------|-----|
| `run.sh` | normal run, pulls image from registry |
| `airgapped.run.sh` | offline host: load image from a `.tar` first, no pull |
| `dind.run.sh` | `node-slim-agents-dind` tag with an inner Docker engine, `--privileged` |

Mounts the current dir at `/workspace` and publishes port `3773`. Auth the agent from inside the
T3 Code UI — no API key needed. On first start T3 Code prints a pairing URL in the logs.

```sh
./run.sh
# then open http://localhost:3773
```

Airgapped: on an online host run `docker save ghcr.io/hambn/t3code:node-slim-agents -o t3code.tar`,
copy the tar over, then `./airgapped.run.sh`.
