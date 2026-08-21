# ubuntu-browser: Omnigent on the Ubuntu browser-enabled agentbloat foundation.
ARG BASE_IMAGE=ghcr.io/hambn/agentbloat:ubuntu-browser
FROM ${BASE_IMAGE}

USER root

ARG OMNIGENT_VERSION=latest

SHELL ["/bin/bash", "-euxo", "pipefail", "-c"]

RUN apt-get update && \
    apt-get install -y --no-install-recommends libabsl-dev libre2-dev && \
    rm -rf /var/lib/apt/lists/*

RUN if [ "${OMNIGENT_VERSION}" = latest ]; then \
      package=omnigent; \
    else \
      package="omnigent==${OMNIGENT_VERSION}"; \
    fi && \
    UV_TOOL_DIR=/opt/uv-tools UV_TOOL_BIN_DIR=/usr/local/bin \
      uv tool install --python python3 --force "$package" && \
    rm -rf /root/.cache/uv

ENV PATH=/usr/local/bin:/usr/local/go/bin:$PATH
USER sysadmin
WORKDIR /workspace
ENTRYPOINT ["omnigent"]
