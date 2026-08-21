# Docker

Run the primary browser-enabled image against the current directory:

```sh
./run.sh
AGENTBLOAT_IMAGE=ghcr.io/hambn/agentbloat:alpine ./run.sh
```

Opt in to the host Docker daemon with
`AGENTBLOAT_DOCKER_SOCKET=/var/run/docker.sock ./run.sh`. The script mounts the socket
and adds its GID for the non-root `sysadmin` user; socket access is root-equivalent on the
host.

For an offline host, save `ghcr.io/hambn/agentbloat:latest` on a connected host, copy
the tar beside `airgapped.run.sh`, and run that script.
