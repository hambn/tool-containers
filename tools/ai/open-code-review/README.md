---
name: open-code-review
title: Open Code Review
description: Alibaba's Open Code Review CLI, ocr, which reviews Git changes with an LLM, on the devbox image for Ubuntu and Alpine, with or without a browser.
upstream: https://github.com/alibaba/open-code-review
order: 5
images: [ghcr.io/hambn/open-code-review, docker.io/hambn/open-code-review]
keywords: [ocr, alibaba, ai code review, llm, devbox]
---

# Open Code Review

Alibaba's [Open Code Review](https://github.com/alibaba/open-code-review) CLI, `ocr`, on
the [devbox](../../base/devbox/) development image. `ocr` sends your uncommitted changes,
a commit, or a branch range to the LLM provider you configure and prints review
findings. The entrypoint is `ocr`, and the container starts in `/workspace` as
`sysadmin` (UID 1000). No credentials are stored in the image.

- **Source:** [`tools/ai/open-code-review/`](https://github.com/hambn/tool-containers/tree/main/tools/ai/open-code-review)
- **Docs:** [tool-containers.hgh.dev/docs/ai/open-code-review/](https://tool-containers.hgh.dev/docs/ai/open-code-review/)

## Contents

- [Images](#images)
- [Included software](#included-software)
- [Use cases](#use-cases)
- [Sources](#sources)

## Images

- **`ubuntu`**: Ubuntu 24.04 without a browser. `latest` points here, and the CI recipes use it.
  - Base: [`devbox:ubuntu-full`](../../base/devbox/)
  - Tags: `ubuntu`, `latest`, `open-code-review-<version>`
  - Included software: [Open Code Review](#included-software) and the [devbox full tier](../../base/devbox/#full)
- **`ubuntu-browser`**: Ubuntu 24.04 with headless Chromium, the default in the local recipes.
  - Base: [`devbox:ubuntu-browser`](../../base/devbox/)
  - Tags: `ubuntu-browser`
  - Included software: [Open Code Review](#included-software) and the [devbox browser tier](../../base/devbox/#browser)
- **`alpine`**: Alpine 3.24 without a browser.
  - Base: [`devbox:alpine-full`](../../base/devbox/)
  - Tags: `alpine`
  - Included software: [Open Code Review](#included-software) and the [devbox full tier](../../base/devbox/#full)
- **`alpine-browser`**: Alpine 3.24 with Chromium.
  - Base: [`devbox:alpine-browser`](../../base/devbox/)
  - Tags: `alpine-browser`
  - Included software: [Open Code Review](#included-software) and the [devbox browser tier](../../base/devbox/#browser)

Pull `ghcr.io/hambn/open-code-review:<tag>` or `docker.io/hambn/open-code-review:<tag>`.
`open-code-review-<version>` names the npm release in the current `ubuntu` build. All
tags move when the image is rebuilt; pin a digest to keep one build.

## Included software

- **Open Code Review**
  - Command: `ocr`
  - Source: npm package `@alibaba-group/open-code-review`, version pinned in the [`Dockerfile`](./Dockerfile)

Git, Node.js, Python, Go, the Docker CLI, and the other devbox tools come from the
[devbox full tier](../../base/devbox/#full). The `*-browser` variants add the
[browser tier](../../base/devbox/#browser).

## Use cases

- **Review the current checkout** with [Docker](./docs/docker/), including hosts that
  load the image from a saved tar.
- **Repeatable local reviews** with [Docker compose](./docs/docker-compose/), with an
  air-gapped Compose file.
- **Rootless reviews on a workstation** with [Podman](./docs/podman/).
- **Code review in CI** on GitHub pull requests with
  [GitHub Actions](./docs/github-actions/) or on GitLab merge requests with
  [GitLab CI](./docs/gitlab-ci/).

## Sources

- [Open Code Review repository](https://github.com/alibaba/open-code-review)
- [npm package `@alibaba-group/open-code-review`](https://www.npmjs.com/package/@alibaba-group/open-code-review)
- [Open Code Review website](https://open-codereview.ai)
- [Configuration reference](https://github.com/alibaba/open-code-review/blob/main/pages/src/content/docs/en/configuration.md)
- [CLI reference](https://github.com/alibaba/open-code-review/blob/main/pages/src/content/docs/en/cli-reference.md)
