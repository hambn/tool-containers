# docker-compose

Serves the T3 Code web GUI at `http://localhost:3773`.

| File | Use |
|------|-----|
| `docker-compose.yml` | normal run, pulls image from registry |
| `airgapped.docker-compose.yml` | offline: builds locally from `images/node-slim-agents`, no registry pull |

```sh
ANTHROPIC_API_KEY=sk-... docker compose up
```

Airgapped variant builds the image on the host instead of pulling:

```sh
ANTHROPIC_API_KEY=sk-... docker compose -f airgapped.docker-compose.yml up
```
