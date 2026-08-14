# Docker Swarm

Deploy one long-lived development environment:

```sh
docker stack deploy -c stack.yml agentimg
```

The stack uses the `ubuntu-browser` image through `latest`, stores `/workspace` in a
named volume, and runs `sleep infinity`. Use Docker, Compose, or Podman when you need an
interactive shell.
