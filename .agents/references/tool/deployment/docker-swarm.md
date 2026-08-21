# Docker Swarm stacks

Use `stack.yml` with `docker stack deploy` for detached, long-running cluster services.

## Rules

- Use a current Compose stack format that supports `deploy`; do not use interactive-only
  fields such as `container_name`, `stdin_open`, or `tty`.
- Use Swarm secrets, declared as external secrets, instead of literal environment values;
  document the `docker secret create` command.
- Declare an overlay network and attach the service to it.
- Define replicas, a restart policy, and CPU/memory limits under `deploy:`.
- Reference `ghcr.io/<owner>/<tool>:latest` or a deliberately pinned tag.
- If the tool is interactive, say so and point users to Docker or Compose instead.
