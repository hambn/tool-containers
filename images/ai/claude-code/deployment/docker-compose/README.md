# docker-compose

| File | Use |
|------|-----|
| `docker-compose.yml` | normal run, pulls image from registry |
| `airgapped.docker-compose.yml` | offline: builds a selected local image variant, no registry pull |
| [`../../images/`](../../images/) | the four build variants available to a local build |

```sh
ANTHROPIC_API_KEY=sk-... WORKSPACE="$PWD" docker compose run --rm claude
```

The air-gapped variant builds the `ubuntu-browser` image on the host instead of pulling,
so it works with no registry access:

```sh
ANTHROPIC_API_KEY=sk-... WORKSPACE="$PWD" \
  docker compose -f airgapped.docker-compose.yml run --rm claude
```
