# Deployment conventions

Each tool has a `deployment/` directory with one subdirectory per platform or run mode.
Every platform directory contains a README and runnable examples.

| Directory | Guide |
|-----------|-------|
| `docker/` | [docker.md](docker.md) |
| `docker-compose/` | [docker-compose.md](docker-compose.md) |
| `podman/` | [podman.md](podman.md) |
| `docker-swarm/` | [docker-swarm.md](docker-swarm.md) |
| `kubernetes/` | [kubernetes.md](kubernetes.md) |
| `helm/` | [helm.md](helm.md) |

Add another platform as a new directory with the same README-plus-example shape.

## Shared rules

- Name scenario files `<scenario>.<base-name>`: `docker-compose.yml` is normal and
  `airgapped.docker-compose.yml` is offline.
- Put the exact run command in a top-of-file comment and the platform README.
- Require runtime secrets through environment variables, files, or platform secret stores;
  fail loudly when a required variable is absent.
- Mount the user's workspace at `/workspace`.
- Reference the published GHCR image in normal examples; air-gapped examples load or build
  locally and never assume registry access.
