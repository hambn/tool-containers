# Docker Swarm

Deploy a long-lived agentbloat workspace:

```sh
docker stack deploy -c stack.yml agentbloat
```

The stack uses the primary image through `latest` and stores `/workspace` in a named
volume. Use Docker, Compose, or Podman for an interactive shell.
