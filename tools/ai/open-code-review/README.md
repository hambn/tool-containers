# open-code-review

[`Open Code Review`](https://github.com/alibaba/open-code-review) is Alibaba's AI-powered code review CLI, packaged on the reusable [`workspace`](../../dev/workspace/) images.

## Contents

- [Images](#images)
- [Use cases](#use-cases)
- [File map](#file-map)
- [Sources](#sources)

## Images

Pull from `ghcr.io/hambn/open-code-review:<tag>` or `docker.io/hambn/open-code-review:<tag>`.
Moving tags name the tested operating-system profile. Each successful build also has an immutable `<profile>-b<run-id>-<attempt>` tag. Pin a digest for deployments.

| Tag | Contents | Base |
|---|---|---|
| `ubuntu-24.04` | open-code-review on Ubuntu 24.04 | `workspace:ubuntu-24.04-core` |

## Use cases

- **Review the current workspace** — [`examples/docker/`](./examples/docker/) with `./run.sh review`.
- **Repeatable local reviews** — [`examples/docker-compose/`](./examples/docker-compose/) with `docker compose run --rm open-code-review review`.
- **Rootless review environment** — [`examples/podman/`](./examples/podman/) with `./run.sh review`.

The CLI reads the mounted repository and requires an LLM provider configured through its
supported `ocr config` flow or runtime environment variables. No credentials are stored
in the image or deployment files.

## File map

- [`examples/`](examples/)
  - [`docker/`](examples/docker/)
    - [`README.md`](examples/docker/README.md)
    - [`airgapped.run.sh`](examples/docker/airgapped.run.sh)
    - [`run.sh`](examples/docker/run.sh)
  - [`docker-compose/`](examples/docker-compose/)
    - [`README.md`](examples/docker-compose/README.md)
    - [`airgapped.docker-compose.yml`](examples/docker-compose/airgapped.docker-compose.yml)
    - [`compose.sh`](examples/docker-compose/compose.sh)
    - [`docker-compose.yml`](examples/docker-compose/docker-compose.yml)
  - [`podman/`](examples/podman/)
    - [`README.md`](examples/podman/README.md)
    - [`run.sh`](examples/podman/run.sh)
- [`images/`](images/)
  - [`ubuntu-24.04/`](images/ubuntu-24.04/)
    - [`Dockerfile`](images/ubuntu-24.04/Dockerfile)
- [`README.md`](README.md)
- [Shared image publisher](../../../.github/workflows/publish-images.yml)

## Sources

- [Open Code Review source repository](https://github.com/alibaba/open-code-review)
- [Open Code Review npm package](https://www.npmjs.com/package/@alibaba-group/open-code-review)
- [Open Code Review documentation](https://open-codereview.ai/docs)
- [workspace foundation](../../dev/workspace/)
