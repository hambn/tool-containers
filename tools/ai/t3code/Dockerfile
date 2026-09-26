# syntax=docker/dockerfile:1
# docker build tools/ai/t3code builds the ubuntu-browser variant on agentbloat; the
# other variant only changes BASE_IMAGE (see docker-bake.hcl).
ARG BASE_IMAGE=ghcr.io/hambn/agentbloat:ubuntu-browser
# renovate: datasource=npm depName=t3
ARG T3CODE_VERSION=0.0.42

FROM ${BASE_IMAGE}
ARG T3CODE_VERSION
USER root
RUN npm install -g --prefix=/usr/local --no-audit --no-fund --cache /tmp/npm-cache "t3@${T3CODE_VERSION}" && \
    rm -rf /tmp/npm-cache
LABEL io.github.hambn.containers.tool.t3code.version="${T3CODE_VERSION}"
USER sysadmin
WORKDIR /workspace
EXPOSE 3773
ENTRYPOINT ["t3", "serve", "--host=0.0.0.0", "--port=3773"]
