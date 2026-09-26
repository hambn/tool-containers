# Platform example conventions

Each supported platform lives at `tools/<category>/<tool>/examples/<platform>/` with a
README plus runnable files. Add only platforms that serve the tool's real use cases.
The `references/deployment/` path is this skill's grouping; image projects always use
`examples/`.

| Platform | Guide |
|---|---|
| Plain Docker | [docker.md](docker.md) |
| Docker Compose | [docker-compose.md](docker-compose.md) |
| Rootless Podman | [podman.md](podman.md) |
| Raw Kubernetes | [kubernetes.md](kubernetes.md) |
| Helm | [helm.md](helm.md) |

Docker Swarm is not a supported example platform.

## Execution model

- **One-shot CLIs** (claude-code, codex, pi-agent, open-code-review): interactive
  `run --rm` locally; a Kubernetes `batch/v1` Job (raw or Helm) in clusters. Never model
  them as long-lived Deployments or services.
- **Services** (t3code, omnigent): may use Compose services, Deployments, and a Service.
- **Base images** (core, devbox, agentbloat): examples show interactive or CI use.

## Shared contract

- Put the exact run/apply command in the README and, where the format allows, a
  top-of-file comment.
- Mount the user's workspace at `/workspace`; require an explicit absolute host path
  where the platform expands a host bind mount.
- Keep credentials external (environment, mounted files, native secret stores) and fail
  loudly when a required value is missing.
- Connected examples use a moving tag from `ghcr.io/hambn/<repo>` (for example
  `ghcr.io/hambn/codex:ubuntu-browser`) and explain that a digest pins
  it ([tags](../registries-and-tags.md)). Air-gapped examples load a saved image and
  never pull.
- Grant the least privilege and resources compatible with the tool; do not copy
  security fields between orchestrators that do not support them.
- Keep names, commands, arguments, variables, ports, volumes, and secrets consistent with
  the Dockerfile and tool README.

README structure is owned by `$documentation`. Render or lint each artifact with the
platform tooling (`bash -n`, `docker compose config`, `helm lint`/`helm template`,
`kubectl --dry-run=client`) when available; never start containers without user
authorization.
