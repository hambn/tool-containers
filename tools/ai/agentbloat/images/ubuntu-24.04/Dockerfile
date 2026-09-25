# syntax=docker/dockerfile:1
ARG BASE_IMAGE=ghcr.io/hambn/workspace:ubuntu-24.04-core
FROM ${BASE_IMAGE}
USER root
ENV HOME=/root

ARG CODEX_VERSION=latest
ARG CLAUDE_CODE_VERSION=latest
ARG CURSOR_AGENT_VERSION=latest
ARG GROK_VERSION=latest
ARG OPENCODE_VERSION=latest
ARG GITHUB_COPILOT_VERSION=latest
ARG GEMINI_CLI_VERSION=latest
ARG PI_AGENT_VERSION=latest
ARG ACP_AGENT_VERSION=latest

RUN npm install --prefix /opt/agent-bundle --no-fund --no-audit \
      "@openai/codex@${CODEX_VERSION}" \
      "@anthropic-ai/claude-code@${CLAUDE_CODE_VERSION}" \
      "@xai-official/grok@${GROK_VERSION}" \
      "opencode-ai@${OPENCODE_VERSION}" \
      "@github/copilot@${GITHUB_COPILOT_VERSION}" \
      "@google/gemini-cli@${GEMINI_CLI_VERSION}" \
      "@earendil-works/pi-coding-agent@${PI_AGENT_VERSION}" && \
    npm cache clean --force

RUN mkdir -p /opt/agent-bundle/bin && \
    if [ "${CURSOR_AGENT_VERSION}" = latest ]; then \
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
    install -m 0755 "$cursor_bin" /opt/agent-bundle/bin/cursor-agent && \
    ln -s cursor-agent /opt/agent-bundle/bin/agent && \
    rm -rf /root/.local

RUN UV_TOOL_DIR=/opt/agent-bundle/uv-tools \
    UV_TOOL_BIN_DIR=/opt/agent-bundle/bin \
    uv tool install --python python3 --force \
      --with agent-client-protocol==0.7.1 \
      "acp-agent==${ACP_AGENT_VERSION}" && \
    rm -rf /root/.cache/uv

ENV PATH=/opt/agent-bundle/bin:/opt/agent-bundle/node_modules/.bin:$PATH
ENV HOME=/home/sysadmin
USER sysadmin
WORKDIR /workspace
CMD ["/bin/bash"]
