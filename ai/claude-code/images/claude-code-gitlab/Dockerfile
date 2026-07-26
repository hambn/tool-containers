# claude-code-gitlab: Claude Code with GitLab's glab MCP server and CI tooling. Node Alpine base.
# syntax=docker/dockerfile:1.7

ARG NODE_VERSION=22
FROM node:${NODE_VERSION}-alpine

ARG CLAUDE_CODE_VERSION=latest
ARG GLAB_VERSION=1.109.0

LABEL org.opencontainers.image.title="Claude Code GitLab CI"
LABEL org.opencontainers.image.description="Claude Code CI image with GitLab MCP, Git, SSH, Python, and native build tooling"

ENV CI=true \
    TERM=xterm-256color \
    NO_COLOR=1 \
    npm_config_update_notifier=false \
    npm_config_fund=false \
    npm_config_audit=false \
    PIP_DISABLE_PIP_VERSION_CHECK=1 \
    PIP_NO_CACHE_DIR=1 \
    CLAUDE_CONFIG_DIR=/home/node/.claude \
    CLAUDE_MCP_CONFIG=/etc/claude/mcp.json

# Install the runtime and toolchain with Alpine's default shell; Bash is selected below
# after it has been installed.
RUN apk add --no-cache \
        bash \
        build-base \
        ca-certificates \
        coreutils \
        curl \
        findutils \
        git \
        git-lfs \
        jq \
        openssh-client \
        python3 \
        py3-pip \
        ripgrep \
        tar \
        tini \
        unzip \
    && git lfs install --system \
    && npm install --global \
        "@anthropic-ai/claude-code@${CLAUDE_CODE_VERSION}" \
    && npm cache clean --force \
    && rm -rf \
        /root/.npm \
        /tmp/*

SHELL ["/bin/bash", "-o", "pipefail", "-c"]

# Install the official GitLab CLI.
#
# TARGETARCH is supplied by Docker BuildKit:
#   amd64 -> amd64
#   arm64 -> arm64
ARG TARGETARCH

RUN set -eux; \
    case "${TARGETARCH}" in \
        amd64) glab_arch="amd64" ;; \
        arm64) glab_arch="arm64" ;; \
        *) echo "Unsupported architecture: ${TARGETARCH}" >&2; exit 1 ;; \
    esac; \
    filename="glab_${GLAB_VERSION}_linux_${glab_arch}.tar.gz"; \
    release_url="https://gitlab.com/gitlab-org/cli/-/releases/v${GLAB_VERSION}/downloads"; \
    curl --fail --show-error --silent --location \
        "${release_url}/${filename}" \
        --output "/tmp/${filename}"; \
    curl --fail --show-error --silent --location \
        "${release_url}/checksums.txt" \
        --output /tmp/checksums.txt; \
    cd /tmp; \
    grep " ${filename}\$" checksums.txt | sha256sum -c -; \
    tar -xzf "${filename}"; \
    install -m 0755 bin/glab /usr/local/bin/glab; \
    rm -rf "/tmp/${filename}" /tmp/checksums.txt /tmp/bin; \
    glab version

# Configure GitLab's local stdio MCP server. Claude starts glab as a subprocess
# when the MCP configuration is supplied with --mcp-config.
RUN install -d -m 0755 /etc/claude \
    && printf '%s\n' \
        '{' \
        '  "mcpServers": {' \
        '    "gitlab": {' \
        '      "type": "stdio",' \
        '      "command": "glab",' \
        '      "args": ["mcp", "serve"]' \
        '    }' \
        '  }' \
        '}' \
        > /etc/claude/mcp.json

# Prepare the non-root user's configuration directories for runners that support
# arbitrary image users. The image intentionally remains root by default for CI
# workspace, socket, package, SSH, and artifact compatibility.
RUN install -d -o node -g node \
        /workspace \
        /home/node/.claude \
        /home/node/.config/glab \
    && git config --system --add safe.directory '*'

WORKDIR /workspace

# Do not set ENTRYPOINT to Claude. GitLab Runner must be able to execute its
# generated shell script normally.
ENTRYPOINT ["/sbin/tini", "--"]
CMD ["/bin/bash"]
