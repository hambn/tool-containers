# docker-compose

| File | Use |
|------|-----|
| `docker-compose.yml` | normal run, pulls image from registry |
| `airgapped.docker-compose.yml` | offline: builds locally from `images/default`, no registry pull |

```sh
ANTHROPIC_API_KEY=sk-... docker compose run --rm claude
```

Airgapped variant builds the image on the host instead of pulling, so it works with no registry access:

```sh
ANTHROPIC_API_KEY=sk-... docker compose -f airgapped.docker-compose.yml run --rm claude
```
