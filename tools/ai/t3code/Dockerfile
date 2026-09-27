# syntax=docker/dockerfile:1
# docker build tools/ai/t3code builds the ubuntu-browser variant on agentbloat; the
# other variant only changes BASE_IMAGE (see docker-bake.hcl).
ARG BASE_IMAGE=ghcr.io/hambn/agentbloat:ubuntu-browser
# renovate: datasource=docker depName=docker.io/library/node
ARG NPM_BUILD_IMAGE=docker.io/library/node:24.21.0-bookworm-slim@sha256:0e0ff40c39bc087845bfb27465a0df4ea419520094bc35842ff83dd8cbe6f9b6
# renovate: datasource=npm depName=t3
ARG T3CODE_VERSION=0.0.42

FROM ${NPM_BUILD_IMAGE} AS t3code-package
ARG T3CODE_VERSION
RUN npm install -g --prefix=/out/usr/local --no-audit --no-fund --cache /tmp/npm-cache "t3@${T3CODE_VERSION}" && \
    rm -rf /tmp/npm-cache

FROM ${BASE_IMAGE}
USER root
COPY --link --from=t3code-package /out/ /
ARG T3CODE_VERSION
LABEL io.github.hambn.containers.tool.t3code.version="${T3CODE_VERSION}"
USER sysadmin
WORKDIR /workspace
EXPOSE 3773
ENTRYPOINT ["t3", "serve", "--host=0.0.0.0", "--port=3773"]
