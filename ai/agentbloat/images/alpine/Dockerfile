# alpine: agentimg Alpine foundation with the current agent CLIs, without a browser.
FROM ghcr.io/hambn/agentimg:alpine

ARG CODEX_VERSION=latest
ARG CLAUDE_CODE_VERSION=latest
ARG CURSOR_AGENT_VERSION=latest
ARG GROK_VERSION=latest
ARG OPENCODE_VERSION=latest
ARG GITHUB_COPILOT_VERSION=latest
ARG GEMINI_CLI_VERSION=latest
ARG PI_AGENT_VERSION=latest
ARG ACP_AGENT_VERSION=latest

RUN apk add --no-cache gcompat nodejs npm

RUN npm install --global --no-fund --no-audit \
      "@openai/codex@${CODEX_VERSION}" \
      "@anthropic-ai/claude-code@${CLAUDE_CODE_VERSION}" \
      "@xai-official/grok@${GROK_VERSION}" \
      "opencode-ai@${OPENCODE_VERSION}" \
      "@github/copilot@${GITHUB_COPILOT_VERSION}" \
      "@google/gemini-cli@${GEMINI_CLI_VERSION}" \
      "@earendil-works/pi-coding-agent@${PI_AGENT_VERSION}" && \
    npm cache clean --force

RUN if [ "${CURSOR_AGENT_VERSION}" = latest ]; then \
      curl -fsSL https://cursor.com/install | bash; \
    else \
      mkdir -p "/root/.local/share/cursor-agent/versions/${CURSOR_AGENT_VERSION}" && \
      curl -fsSL "https://downloads.cursor.com/lab/${CURSOR_AGENT_VERSION}/linux/x64/agent-cli-package.tar.gz" | \
        tar --strip-components=1 -xzf - -C "/root/.local/share/cursor-agent/versions/${CURSOR_AGENT_VERSION}"; \
    fi && \
    cursor_bin=$(readlink -f /root/.local/bin/cursor-agent) && \
    install -m 0755 "$cursor_bin" /usr/local/bin/cursor-agent && \
    ln -sf cursor-agent /usr/local/bin/agent && \
    rm -rf /root/.local

RUN python3 -m pip install --break-system-packages --no-cache-dir \
      "acp-agent==${ACP_AGENT_VERSION}" && \
    rm -rf /root/.cache/pip

ENV PATH=/usr/local/bin:/usr/local/go/bin:$PATH
WORKDIR /workspace
CMD ["/bin/bash"]
