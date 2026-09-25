# syntax=docker/dockerfile:1
FROM base AS payload
USER root
ARG OPEN_CODE_REVIEW_VERSION
RUN npm install -g --no-audit --no-fund --cache /tmp/npm-cache "@alibaba-group/open-code-review@${OPEN_CODE_REVIEW_VERSION}" && \
    rm -rf /tmp/npm-cache

FROM payload AS image
COPY --link --from=devbox-config / /
USER sysadmin
WORKDIR /workspace
ENTRYPOINT ["ocr"]
