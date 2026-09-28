---
name: base
title: Base
description: Hardened minimal application bases and interactive development images on Wolfi, Alpine, and Ubuntu that the other images in the catalog build from.
order: 2
---

# Base

Base images that the rest of the catalog builds `FROM`. [`core`](./core/) is a hardened
minimal application base; [`devbox`](./devbox/) builds on it as an interactive
development and CI image, and every [AI](../ai/) image builds on devbox. Both are
published to GHCR and Docker Hub under the tags described in the
[catalog](../../README.md#images-and-tags).

- **Source:** [`tools/base/`](https://github.com/hambn/tool-containers/tree/main/tools/base)
- **Docs:** [tool-containers.hgh.dev/docs/base/](https://tool-containers.hgh.dev/docs/base/)

## Tools

- [core](./core/) — Hardened minimal base images on Wolfi, Alpine, and Ubuntu with CA certificates, tzdata, curl, bash, and a nonroot user.
- [devbox](./devbox/) — Interactive Ubuntu and Alpine development and CI images in lite, full, and browser tiers, built on core.
