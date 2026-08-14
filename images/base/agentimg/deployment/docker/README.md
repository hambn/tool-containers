# Docker

`run.sh` opens a shell in the published `ubuntu-browser` image and mounts the current
directory at `/workspace`. Override the tag with `AGENTIMG_IMAGE`.

```sh
./run.sh
AGENTIMG_IMAGE=ghcr.io/hambn/agentimg:alpine ./run.sh
```

The image contains a verified Docker CLI, Buildx, and Compose. To connect it to the
host daemon, opt in to mounting the socket; `run.sh` also adds the socket GID so the
non-root `agent` user can access it:

```sh
AGENTIMG_DOCKER_SOCKET=/var/run/docker.sock ./run.sh
docker info
```

Treat access to that socket as root-equivalent access to the host.

For an offline host, save the image on a connected host with
`docker save ghcr.io/hambn/agentimg:latest -o agentimg.tar`, copy it beside
`airgapped.run.sh`, and run `./airgapped.run.sh`.

Running Ubuntu with systemd or starting Docker/Tailscale inside any variant requires the
additional privileges and host integration appropriate for those daemons. The default
recipe intentionally opens only an unprivileged development shell and does not start a
nested Docker daemon.
