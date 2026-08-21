# docker-compose

Serves the T3 Code web GUI at `http://localhost:3773`. Auth the agent from the UI.

| File | Use |
|------|-----|
| `docker-compose.yml` | normal run, pulls image from registry |
| `airgapped.docker-compose.yml` | offline: builds locally from `images/ubuntu-browser`, no registry pull |
| `compose.sh` | validates an absolute `WORKSPACE`, then invokes Compose |

```sh
WORKSPACE="$PWD" ./compose.sh up
```

Airgapped variant builds the image on the host instead of pulling:

```sh
WORKSPACE="$PWD" ./compose.sh -f airgapped.docker-compose.yml up
```

Both definitions mount the caller's `WORKSPACE` directory at `/workspace` after the
launcher rejects missing or relative values.
