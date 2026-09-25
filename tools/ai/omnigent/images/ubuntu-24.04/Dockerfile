# syntax=docker/dockerfile:1
ARG AGENT_BUNDLE_IMAGE=ghcr.io/hambn/agentbloat:ubuntu-24.04
ARG BASE_IMAGE=ghcr.io/hambn/workspace:ubuntu-24.04-core
FROM ${AGENT_BUNDLE_IMAGE} AS agents
FROM ${BASE_IMAGE}
USER root
ENV HOME=/root

COPY --link --from=agents /opt/agent-bundle /opt/agent-bundle
ARG OMNIGENT_VERSION=latest
RUN apt-get update && \
    DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends \
      libabsl-dev libre2-dev && \
    rm -rf /var/lib/apt/lists/*
RUN if [ "${OMNIGENT_VERSION}" = latest ]; then package=omnigent; \
    else package="omnigent==${OMNIGENT_VERSION}"; fi && \
    UV_TOOL_DIR=/opt/uv-tools UV_TOOL_BIN_DIR=/usr/local/bin \
      uv tool install --python python3 --force "$package" && \
    rm -rf /root/.cache/uv

ENV PATH=/opt/agent-bundle/bin:/opt/agent-bundle/node_modules/.bin:/usr/local/bin:$PATH
ENV HOME=/home/sysadmin
USER sysadmin
WORKDIR /workspace
ENTRYPOINT ["omnigent"]
