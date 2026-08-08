# Repository authoring index

This is the routing index for writing files in `tool-containers`. Read the narrowest
guide that matches the change; do not load every guide by default.

## Repository-wide guides

| Guide | Use when |
|-------|----------|
| [file structure](repo/file-structure.md) | Adding a category, tool, image variant, deployment, or workflow |
| [root README](repo/root-readme.md) | Editing the root catalog |
| [registries and tags](repo/registries-and-tags.md) | Changing image publication or tag behavior |

## One-tool guides

| Guide | Use when |
|-------|----------|
| [tool README](tool/readme.md) | Editing a tool's documentation |
| [CI workflow](tool/ci.md) | Adding or changing `.github/workflows/<category>-<tool>.yml` |
| [image variants](tool/images/variants.md) | Adding or renaming an image profile |
| [Dockerfile](tool/images/dockerfile.md) | Editing a variant Dockerfile |
| [base images](tool/images/base-images.md) | Choosing or changing a base image |
| [deployment conventions](tool/deployment/conventions.md) | Adding a platform or deployment scenario |
| [Docker](tool/deployment/docker.md) | Editing `docker run` recipes |
| [Compose](tool/deployment/docker-compose.md) | Editing Compose files |
| [Podman](tool/deployment/podman.md) | Editing rootless Podman recipes |
| [Swarm](tool/deployment/docker-swarm.md) | Editing a Swarm stack |
| [Kubernetes](tool/deployment/kubernetes.md) | Editing raw Kubernetes manifests |
| [Helm](tool/deployment/helm.md) | Editing a Helm chart |

## Starting a tool

Copy the shape of an existing tool only after reading [file structure](repo/file-structure.md),
[image variants](tool/images/variants.md), [deployment conventions](tool/deployment/conventions.md),
and [CI workflow](tool/ci.md). Edit the tool README, every image/deployment file, the
matching workflow, and the root catalog row in the same change.
