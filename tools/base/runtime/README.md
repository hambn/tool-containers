# runtime

Small Alpine and Ubuntu bases for applications that need a POSIX shell and `curl` for health checks. Both profiles start as UID/GID 1000 and include CA certificates.

## Contents

- [Images](#images)
- [Use cases](#use-cases)
- [File map](#file-map)
- [Sources](#sources)

## Images

| Tag | Contents | Upstream base |
|---|---|---|
| `alpine-3.21-minimal` | BusyBox shell, curl, CA certificates, non-root user | Alpine 3.21 |
| `ubuntu-24.04-minimal` | POSIX shell, curl, CA certificates, non-root user | Ubuntu 24.04 |

Pull `ghcr.io/hambn/runtime:<tag>` or `docker.io/hambn/runtime:<tag>`. Moving tags receive tested updates. Each build also has an immutable `<tag>-b<run-id>-<attempt>` tag; use an image digest when a deployment must keep the exact build. These images do not include a compiler, Node.js, Python, Docker, or a service manager.

## Use cases

- Use [`examples/docker/run.sh`](examples/docker/run.sh) to inspect the shell and health-check command.
- Use an image as `FROM ghcr.io/hambn/runtime:ubuntu-24.04-minimal` in an application Dockerfile.
- Pin a tested digest in a deployment manifest when repeatable rollout matters.

## File map

- [`examples/`](examples/)
  - [`docker/`](examples/docker/)
    - [`README.md`](examples/docker/README.md)
    - [`run.sh`](examples/docker/run.sh)
- [`images/`](images/)
  - [`alpine-minimal/`](images/alpine-minimal/)
    - [`Dockerfile`](images/alpine-minimal/Dockerfile)
  - [`ubuntu-minimal/`](images/ubuntu-minimal/)
    - [`Dockerfile`](images/ubuntu-minimal/Dockerfile)
- [`README.md`](README.md)
- [Shared image publisher](../../../.github/workflows/publish-images.yml)

## Sources

- [Alpine Linux image](https://hub.docker.com/_/alpine)
- [Ubuntu image](https://hub.docker.com/_/ubuntu)
