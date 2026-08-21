# Docker Swarm stacks

Use `stack.yml` with `docker stack deploy` for detached cluster services. Interactive
coding tools may be a poor fit; document that limitation and point users to Docker or
Compose when appropriate.

- Use a Compose stack format that supports `deploy`. Do not include local-only fields
  such as `container_name`, `stdin_open`, or `tty`.
- Store credentials as external Swarm secrets and document `docker secret create`;
  never embed literal secret values.
- Declare an overlay network and attach each service that needs it.
- Define intentional replicas, restart policy, update behavior, and CPU/memory limits
  under `deploy:`.
- Use `ghcr.io/<owner>/<tool>:<tag>` with a deliberately chosen tag or digest.
- Do not claim `security_opt` hardening: `docker stack deploy` does not reliably apply
  that field to Swarm services. Document the platform limitation when
  `no-new-privileges` is required.
- Keep bind mounts compatible with every node or use named volumes/shared storage with a
  documented persistence model.

Validate interpolation and structure with a Swarm-compatible Compose render, then
inspect the resolved service, secret, network, and resource settings. Rendering is not a
cluster deployment test.
