# docker-compose

| File | Use |
|------|-----|
| `docker-compose.yml` | normal run, pulls image from registry |
| `airgapped.docker-compose.yml` | offline: builds a selected local image variant, no registry pull |
| `compose.sh` | validates an absolute `WORKSPACE`, then invokes Compose |
| [`../../images/`](../../images/) | the four build variants available to a local build |

Create a permission-restricted temporary environment file without putting the API key in
shell history:

```bash
umask 077
credentials=$(mktemp)
trap 'rm -f "$credentials"' EXIT
read -rsp 'Anthropic API key: ' api_key; printf '\n'
printf 'ANTHROPIC_API_KEY=%s\n' "$api_key" >"$credentials"
unset api_key
```

Then run the published image:

```sh
WORKSPACE="$PWD" ./compose.sh --env-file "$credentials" run --rm claude
```

The air-gapped variant builds the `ubuntu-browser` image on the host instead of pulling,
so it works with no registry access:

```sh
WORKSPACE="$PWD" ./compose.sh --env-file "$credentials" \
  -f airgapped.docker-compose.yml run --build --rm claude
```
