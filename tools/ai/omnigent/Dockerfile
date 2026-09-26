# syntax=docker/dockerfile:1
# docker build tools/ai/omnigent builds the ubuntu-browser variant on agentbloat. For
# an Alpine variant set both DISTRO=alpine and an Alpine BASE_IMAGE (see docker-bake.hcl).
ARG BASE_IMAGE=ghcr.io/hambn/agentbloat:ubuntu-browser
ARG DISTRO=ubuntu
ARG OS_REFRESH=2026-09-25
# renovate: datasource=pypi depName=omnigent
ARG OMNIGENT_VERSION=0.15.0

FROM ${BASE_IMAGE} AS base

FROM base AS build-ubuntu

# google-re2 (via cel-python) has no musllinux wheels, so it compiles against re2 on Alpine.
FROM base AS build-alpine
USER root
ARG OS_REFRESH
RUN apk add --no-cache abseil-cpp-dev py3-pybind11-dev python3-dev re2-dev

FROM build-${DISTRO} AS build
USER root
ARG OMNIGENT_VERSION
RUN UV_TOOL_DIR=/opt/uv-tools UV_TOOL_BIN_DIR=/out/usr/local/bin uv tool install --no-cache --python python3 \
        "omnigent==${OMNIGENT_VERSION}"

FROM base AS runtime-ubuntu

FROM base AS runtime-alpine
USER root
ARG OS_REFRESH
RUN apk add --no-cache re2

FROM runtime-${DISTRO}
ARG OMNIGENT_VERSION
USER root
COPY --link --from=build /opt/uv-tools/omnigent/ /opt/uv-tools/omnigent/
COPY --link --from=build /out/ /
LABEL io.github.hambn.containers.tool.omnigent.version="${OMNIGENT_VERSION}"
USER sysadmin
WORKDIR /workspace
ENTRYPOINT ["omnigent"]
