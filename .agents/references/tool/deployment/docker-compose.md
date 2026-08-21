# Docker Compose

Use one service named after the tool and keep the normal and offline cases as separate
files.

| File | Use |
|------|-----|
| `docker-compose.yml` | normal pull from a registry |
| `airgapped.docker-compose.yml` | local build or preloaded image with no pull |
| `README.md` | file map and `docker compose` commands |

## Rules

- Do not add the obsolete top-level `version` key.
- Set an explicit top-level `name` and a dedicated network named after the tool.
- Use `container_name` and `hostname` only when stable local names are useful; do not
  carry those interactive conveniences into Swarm.
- Run interactive tools with `stdin_open: true`, `tty: true`, and `docker compose run --rm`.
- Mount `./:/workspace` and use fail-loud environment defaults for required secrets.
- Normal files use `image: ghcr.io/<owner>/<tool>:latest`; offline files use a local build
  context or a preloaded local tag.
