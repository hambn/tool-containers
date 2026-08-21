# Docker Compose

Keep connected and offline cases separate:

| File | Purpose |
|---|---|
| `docker-compose.yml` | published image with normal registry access |
| `airgapped.docker-compose.yml` | preloaded image or local build with no pull |
| `compose.sh` | validates host inputs and invokes Compose consistently |
| `README.md` | prerequisites, commands, variables, file map, and cleanup |

## Compose rules

- Do not add the obsolete top-level `version` key.
- Set an explicit project `name`, one service named after the tool, and a dedicated
  network. Use stable `container_name` or `hostname` only when useful for local operation.
- For interactive agents, set `stdin_open: true` and `tty: true`, then document
  `docker compose run --rm` rather than treating the service as a daemon.
- Require an explicit absolute host workspace such as
  `${WORKSPACE:?Set WORKSPACE to an absolute host path}:/workspace`. Route user commands
  through `compose.sh` when validation is needed before Compose interpolates the value.
- Require secrets with fail-loud interpolation or an external env file whose permissions
  and non-commit status are documented.
- The connected file uses `image: ghcr.io/<owner>/<tool>:<tag>`. The offline file uses a
  preloaded local tag or self-contained build and a pull policy that prevents registry
  access.
- Keep dependencies, health checks, ports, restart behavior, and volumes minimal and
  specific to the tool.

Validate both files with `docker compose -f <file> config --quiet` using safe placeholder
environment values. Rendering does not prove the image can run; smoke-test the relevant
command when runtime behavior changed.
