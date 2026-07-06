# docker-compose

Serves the T3 Code web GUI at `http://localhost:3773`. Auth the agent from the UI.

| File | Use |
|------|-----|
| `docker-compose.yml` | normal run, pulls image from registry |
| `airgapped.docker-compose.yml` | offline: builds locally from `images/node-slim-agents`, no registry pull |

```sh
docker compose up
```

Airgapped variant builds the image on the host instead of pulling:

```sh
docker compose -f airgapped.docker-compose.yml up
```
