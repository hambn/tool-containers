# syntax=docker/dockerfile:1
ARG ALPINE_IMAGE

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

FROM base AS payload
USER root
ARG CODEX_VERSION
ARG CLAUDE_CODE_VERSION
ARG GROK_VERSION
ARG OPENCODE_VERSION
ARG COPILOT_VERSION
ARG GEMINI_VERSION
ARG PI_VERSION
RUN npm install -g --no-audit --no-fund --cache /tmp/npm-cache \
        "@openai/codex@${CODEX_VERSION}" \
        "@anthropic-ai/claude-code@${CLAUDE_CODE_VERSION}" \
        "@xai-official/grok@${GROK_VERSION}" \
        "opencode-ai@${OPENCODE_VERSION}" \
        "@github/copilot@${COPILOT_VERSION}" \
        "@google/gemini-cli@${GEMINI_VERSION}" \
        "@earendil-works/pi-coding-agent@${PI_VERSION}" && \
    rm -rf /tmp/npm-cache
ARG ACP_AGENT_VERSION
ARG AGENT_CLIENT_PROTOCOL_VERSION
RUN UV_TOOL_DIR=/opt/uv-tools UV_TOOL_BIN_DIR=/usr/local/bin uv tool install --no-cache --python python3 \
        --with "agent-client-protocol==${AGENT_CLIENT_PROTOCOL_VERSION}" \
        "acp-agent==${ACP_AGENT_VERSION}"
COPY --link --from=cursor-agent /out/ /

FROM payload AS image
COPY --link --from=devbox-config / /
USER sysadmin
WORKDIR /workspace
CMD ["/bin/zsh", "-l"]
