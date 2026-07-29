# Docker

`run.sh` opens a shell in the published `ubuntu-browser` image and mounts the current
directory at `/workspace`. Override the tag with `AGENTIMG_IMAGE`.

```sh
./run.sh
AGENTIMG_IMAGE=ghcr.io/hambn/agentimg:alpine ./run.sh
```

For an offline host, save the image on a connected host with
`docker save ghcr.io/hambn/agentimg:latest -o agentimg.tar`, copy it beside
`airgapped.run.sh`, and run `./airgapped.run.sh`.

Running Ubuntu with systemd or starting Docker/Tailscale inside any variant requires the
additional privileges and host integration appropriate for those daemons; the default
recipe intentionally opens only an unprivileged development shell.
