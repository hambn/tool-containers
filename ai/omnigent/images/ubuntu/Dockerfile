# ubuntu: Omnigent on the Ubuntu agentbloat foundation without a browser.
FROM ghcr.io/hambn/agentbloat:ubuntu

ARG OMNIGENT_VERSION=latest

SHELL ["/bin/bash", "-euxo", "pipefail", "-c"]

RUN if [ "${OMNIGENT_VERSION}" = latest ]; then \
      package=omnigent; \
    else \
      package="omnigent==${OMNIGENT_VERSION}"; \
    fi && \
    UV_TOOL_BIN_DIR=/usr/local/bin uv tool install --python python3 --force "$package" && \
    rm -rf /root/.cache/uv

ENV PATH=/usr/local/bin:/usr/local/go/bin:$PATH
WORKDIR /workspace
ENTRYPOINT ["omnigent"]
