# syntax=docker/dockerfile:1
FROM base AS payload
USER root
ARG CLAUDE_CODE_VERSION
RUN npm install -g --no-audit --no-fund --cache /tmp/npm-cache "@anthropic-ai/claude-code@${CLAUDE_CODE_VERSION}" && \
    rm -rf /tmp/npm-cache

FROM payload AS image
COPY --link --from=devbox-config / /
USER sysadmin
WORKDIR /workspace
ENTRYPOINT ["claude"]
