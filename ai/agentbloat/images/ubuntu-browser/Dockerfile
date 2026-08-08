# ubuntu-browser: agentimg Ubuntu foundation with Chromium and the current agent CLIs.
FROM ghcr.io/hambn/agentimg:ubuntu-browser

USER root

ARG CODEX_VERSION=latest
ARG CLAUDE_CODE_VERSION=latest
ARG CURSOR_AGENT_VERSION=latest
ARG GROK_VERSION=latest
ARG OPENCODE_VERSION=latest
ARG GITHUB_COPILOT_VERSION=latest
ARG GEMINI_CLI_VERSION=latest
ARG PI_AGENT_VERSION=latest
ARG ACP_AGENT_VERSION=latest
ARG NODE_MAJOR=22

SHELL ["/bin/bash", "-euxo", "pipefail", "-c"]
ENV DEBIAN_FRONTEND=noninteractive

RUN curl -fsSL "https://deb.nodesource.com/setup_${NODE_MAJOR}.x" | bash - && \
    apt-get update && \
    apt-get install -y --no-install-recommends nodejs && \
    rm -rf /var/lib/apt/lists/*

RUN npm install --global --no-fund --no-audit \
      "@openai/codex@${CODEX_VERSION}" \
      "@anthropic-ai/claude-code@${CLAUDE_CODE_VERSION}" \
      "@xai-official/grok@${GROK_VERSION}" \
      "opencode-ai@${OPENCODE_VERSION}" \
      "@github/copilot@${GITHUB_COPILOT_VERSION}" \
      "@google/gemini-cli@${GEMINI_CLI_VERSION}" \
      "@earendil-works/pi-coding-agent@${PI_AGENT_VERSION}" && \
    npm cache clean --force

# The official Cursor installer resolves the latest release. CI passes the resolved
# release identifier so scheduled builds remain reproducible between plan and build.
RUN if [ "${CURSOR_AGENT_VERSION}" = latest ]; then \
      curl -fsSL https://cursor.com/install | bash && \
      cursor_bin=$(readlink -f /root/.local/bin/cursor-agent); \
    else \
      cursor_dir="/root/.local/share/cursor-agent/versions/${CURSOR_AGENT_VERSION}" && \
      mkdir -p "$cursor_dir" && \
      curl -fsSL "https://downloads.cursor.com/lab/${CURSOR_AGENT_VERSION}/linux/x64/agent-cli-package.tar.gz" | \
        tar --strip-components=1 -xzf - -C "$cursor_dir" && \
      cursor_bin="$cursor_dir/cursor-agent"; \
    fi && \
    test -x "$cursor_bin" && \
    install -m 0755 "$cursor_bin" /usr/local/bin/cursor-agent && \
    ln -sf cursor-agent /usr/local/bin/agent && \
    rm -rf /root/.local

# acp-agent is the CLI companion for browsing, searching, and running the official
# ACP Registry. The registry itself is a hosted JSON index, not an installable binary.
RUN UV_TOOL_BIN_DIR=/usr/local/bin uv tool install --python python3 --force \
      --with agent-client-protocol==0.7.1 \
      "acp-agent==${ACP_AGENT_VERSION}" && \
    rm -rf /root/.cache/uv

ENV PATH=/usr/local/bin:/usr/local/go/bin:$PATH
USER agent
WORKDIR /workspace
CMD ["/bin/zsh", "-l"]
