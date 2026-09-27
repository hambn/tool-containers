# syntax=docker/dockerfile:1
# docker build tools/ai/agentbloat builds the ubuntu-browser variant; the other
# variants only change BASE_IMAGE (see docker-bake.hcl).
ARG BASE_IMAGE=ghcr.io/hambn/devbox:ubuntu-browser
ARG DISTRO=ubuntu
ARG OS_REFRESH=2026-09-25
# renovate: datasource=docker depName=docker.io/library/alpine
ARG ALPINE_IMAGE=docker.io/library/alpine:3.24@sha256:294b683cb724975bec92580e1e685676bd4b50bda910ddb8c51d4cabeaec77e6
# renovate: datasource=docker depName=docker.io/library/node
ARG UBUNTU_NPM_IMAGE=docker.io/library/node:24.21.0-bookworm-slim@sha256:0e0ff40c39bc087845bfb27465a0df4ea419520094bc35842ff83dd8cbe6f9b6
# renovate: datasource=docker depName=docker.io/library/node
ARG ALPINE_NPM_IMAGE=docker.io/library/node:24.21.0-alpine3.24@sha256:ebfe2f90462722a7a4de65e91990e97fe0d401c70e0e762c5b53302f905ec1c1

# renovate: datasource=npm depName=@anthropic-ai/claude-code
ARG CLAUDE_CODE_VERSION=2.1.282
# renovate: datasource=npm depName=@openai/codex
ARG CODEX_VERSION=0.157.0
# renovate: datasource=npm depName=@earendil-works/pi-coding-agent
ARG PI_VERSION=0.87.1
# renovate: datasource=npm depName=@xai-official/grok
ARG GROK_VERSION=1.0.41
# renovate: datasource=npm depName=opencode-ai
ARG OPENCODE_VERSION=1.18.32
# renovate: datasource=npm depName=@github/copilot
ARG COPILOT_VERSION=1.0.88
# renovate: datasource=npm depName=@google/gemini-cli
ARG GEMINI_VERSION=0.61.0
# renovate: datasource=custom.cursor-agent depName=cursor-agent
ARG CURSOR_AGENT_VERSION=2026.09.23-86fc751
# renovate: datasource=pypi depName=acp-agent
ARG ACP_AGENT_VERSION=0.2.4
# Held: newer releases conflict with the distro Python packages acp-agent runs beside.
# renovate: datasource=pypi depName=agent-client-protocol
ARG AGENT_CLIENT_PROTOCOL_VERSION=0.7.1

FROM --platform=$BUILDPLATFORM ${ALPINE_IMAGE} AS fetch
ARG OS_REFRESH
RUN apk add --no-cache curl tar

# Cursor publishes no checksum for its agent tarball, so this download cannot be verified.
FROM fetch AS cursor-agent
ARG TARGETARCH
ARG CURSOR_AGENT_VERSION
RUN case "$TARGETARCH" in amd64) arch=x64 ;; arm64) arch=arm64 ;; *) exit 1 ;; esac && \
    curl -fsSLo /tmp/cursor-agent.tar.gz \
        "https://downloads.cursor.com/lab/${CURSOR_AGENT_VERSION}/linux/${arch}/agent-cli-package.tar.gz" && \
    mkdir -p /out/opt/cursor-agent /out/usr/local/bin && \
    tar -xzf /tmp/cursor-agent.tar.gz --strip-components=1 -C /out/opt/cursor-agent && \
    test -x /out/opt/cursor-agent/cursor-agent && \
    ln -s /opt/cursor-agent/cursor-agent /out/usr/local/bin/cursor-agent && \
    ln -s /opt/cursor-agent/cursor-agent /out/usr/local/bin/agent

# Build tools let npm compile native addons in these temporary stages; none of them
# reach the published image.
FROM ${UBUNTU_NPM_IMAGE} AS ubuntu-npm
RUN apt-get update && \
    DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends python3 make g++ && \
    rm -rf /var/lib/apt/lists/*
FROM ${ALPINE_NPM_IMAGE} AS alpine-npm
RUN apk add --no-cache python3 make g++
FROM ${DISTRO}-npm AS npm-base

# Each CLI has its own build stage. COPY --link keeps its runtime layer reusable
# when devbox changes or another CLI gets a version bump.
FROM npm-base AS codex
ARG CODEX_VERSION
RUN npm install -g --prefix=/out/usr/local --no-audit --no-fund --cache /tmp/npm-cache "@openai/codex@${CODEX_VERSION}" && rm -rf /tmp/npm-cache

FROM npm-base AS claude-code
ARG CLAUDE_CODE_VERSION
RUN npm install -g --prefix=/out/usr/local --no-audit --no-fund --cache /tmp/npm-cache "@anthropic-ai/claude-code@${CLAUDE_CODE_VERSION}" && rm -rf /tmp/npm-cache

FROM npm-base AS grok
ARG GROK_VERSION
RUN npm install -g --prefix=/out/usr/local --no-audit --no-fund --cache /tmp/npm-cache "@xai-official/grok@${GROK_VERSION}" && rm -rf /tmp/npm-cache

FROM npm-base AS opencode
ARG OPENCODE_VERSION
RUN npm install -g --prefix=/out/usr/local --no-audit --no-fund --cache /tmp/npm-cache "opencode-ai@${OPENCODE_VERSION}" && rm -rf /tmp/npm-cache

FROM npm-base AS copilot
ARG COPILOT_VERSION
RUN npm install -g --prefix=/out/usr/local --no-audit --no-fund --cache /tmp/npm-cache "@github/copilot@${COPILOT_VERSION}" && rm -rf /tmp/npm-cache

FROM npm-base AS gemini
ARG GEMINI_VERSION
RUN npm install -g --prefix=/out/usr/local --no-audit --no-fund --cache /tmp/npm-cache "@google/gemini-cli@${GEMINI_VERSION}" && rm -rf /tmp/npm-cache

FROM npm-base AS pi
ARG PI_VERSION
RUN npm install -g --prefix=/out/usr/local --no-audit --no-fund --cache /tmp/npm-cache "@earendil-works/pi-coding-agent@${PI_VERSION}" && rm -rf /tmp/npm-cache

FROM ${BASE_IMAGE}
USER root
COPY --link --from=codex /out/ /
COPY --link --from=claude-code /out/ /
COPY --link --from=grok /out/ /
COPY --link --from=opencode /out/ /
COPY --link --from=copilot /out/ /
COPY --link --from=gemini /out/ /
COPY --link --from=pi /out/ /
# Native addons built above must match the parent's Node ABI; fail when the pinned
# Node build image and devbox's NODE_VERSION drift apart.
RUN --mount=type=bind,from=npm-base,source=/usr/local/include/node/node_version.h,target=/tmp/npm-node-version.h \
    want=$(awk '$1 == "#define" && $2 == "NODE_MODULE_VERSION" && $3 ~ /^[0-9]+$/ {print $3}' /tmp/npm-node-version.h) && \
    have=$(node -p process.versions.modules) && \
    { [ "$want" = "$have" ] || { echo "npm build Node ABI $want != parent Node ABI $have" >&2; exit 1; }; }
ARG ACP_AGENT_VERSION
ARG AGENT_CLIENT_PROTOCOL_VERSION
RUN UV_TOOL_DIR=/opt/uv-tools UV_TOOL_BIN_DIR=/usr/local/bin uv tool install --no-cache --python python3 \
        --with "agent-client-protocol==${AGENT_CLIENT_PROTOCOL_VERSION}" \
        "acp-agent==${ACP_AGENT_VERSION}"
COPY --link --from=cursor-agent /out/ /
USER sysadmin
WORKDIR /home/sysadmin
CMD ["/bin/zsh", "-l"]
