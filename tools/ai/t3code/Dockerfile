# syntax=docker/dockerfile:1
FROM base AS payload
USER root
ARG T3CODE_VERSION
RUN npm install -g --no-audit --no-fund --cache /tmp/npm-cache "t3@${T3CODE_VERSION}" && \
    rm -rf /tmp/npm-cache

FROM payload AS image
COPY --link --from=devbox-config / /
USER sysadmin
WORKDIR /workspace
EXPOSE 3773
ENTRYPOINT ["t3", "serve", "--host=0.0.0.0", "--port=3773"]
