# syntax=docker/dockerfile:1
FROM base AS payload
USER root
ARG CODEX_VERSION
RUN npm install -g --no-audit --no-fund --cache /tmp/npm-cache "@openai/codex@${CODEX_VERSION}" && \
    rm -rf /tmp/npm-cache

FROM payload AS image
COPY --link --from=devbox-config / /
USER sysadmin
WORKDIR /workspace
ENTRYPOINT ["codex"]
