# alpine-browser: Omnigent on the Alpine browser-enabled agentbloat foundation.
ARG BASE_IMAGE=ghcr.io/hambn/agentbloat:alpine-browser
FROM ${BASE_IMAGE}

USER root

ARG OMNIGENT_VERSION=latest

RUN apk add --no-cache abseil-cpp-dev py3-pybind11-dev python3-dev re2-dev

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
