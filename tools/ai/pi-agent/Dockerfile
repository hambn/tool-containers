# syntax=docker/dockerfile:1
FROM base AS payload
USER root
ARG PI_VERSION
RUN npm install -g --no-audit --no-fund --ignore-scripts --cache /tmp/npm-cache "@earendil-works/pi-coding-agent@${PI_VERSION}" && \
    rm -rf /tmp/npm-cache

FROM payload AS image
COPY --link --from=devbox-config / /
USER sysadmin
WORKDIR /workspace
ENTRYPOINT ["pi"]
