# docker

Plain `docker run` usage. Serves the T3 Code web GUI at `http://localhost:3773`.

| File | Use |
|------|-----|
| `run.sh` | normal run, pulls image from registry |
| `airgapped.run.sh` | offline host: load image from a `.tar` first, no pull |

Mounts the current dir at `/workspace` and publishes port `3773`. On first start T3 Code prints a
pairing URL in the logs. The inherited agentbloat image includes the supported CLI agents and
developer tooling, including Docker CLI.

```sh
./run.sh
# then open http://localhost:3773
```

To make the inherited Docker CLI use the host daemon, run
`T3CODE_DOCKER_SOCKET=/var/run/docker.sock ./run.sh`. The script mounts the socket and
adds its GID for the non-root `sysadmin` user. Docker socket access is root-equivalent on
the host, so keep this opt-in.

Airgapped: on an online host run `docker save ghcr.io/hambn/t3code:ubuntu-browser -o t3code.tar`,
copy the tar over, then `./airgapped.run.sh`.
