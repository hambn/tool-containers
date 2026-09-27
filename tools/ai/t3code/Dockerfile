# syntax=docker/dockerfile:1
# docker build tools/ai/t3code builds the ubuntu-browser variant on agentbloat; the
# other variant only changes BASE_IMAGE (see docker-bake.hcl).
ARG BASE_IMAGE=ghcr.io/hambn/agentbloat:ubuntu-browser
# renovate: datasource=docker depName=docker.io/library/node
ARG NPM_BUILD_IMAGE=docker.io/library/node:24.21.0-bookworm-slim@sha256:0e0ff40c39bc087845bfb27465a0df4ea419520094bc35842ff83dd8cbe6f9b6
# renovate: datasource=npm depName=t3
ARG T3CODE_VERSION=0.0.42

FROM ${NPM_BUILD_IMAGE} AS t3code-package
ARG T3CODE_VERSION
ARG TARGETARCH
# npm can omit t3's optional platform binary in a clean build stage. Install it
# explicitly; its node-pty dependency needs build tools in this temporary stage.
RUN apt-get update && \
    DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends python3 make g++ && \
    rm -rf /var/lib/apt/lists/* && \
    case "$TARGETARCH" in amd64) arch=x64 ;; arm64) arch=arm64 ;; *) exit 1 ;; esac && \
    npm install -g --prefix=/out/usr/local --no-audit --no-fund --cache /tmp/npm-cache \
        "t3@${T3CODE_VERSION}" "@t3code/t3-linux-${arch}@${T3CODE_VERSION}" && \
    rm -rf /tmp/npm-cache

FROM ${BASE_IMAGE}
USER root
COPY --link --from=t3code-package /out/ /
# Native addons built above must match the parent's Node ABI; fail when the pinned
# Node build image and devbox's NODE_VERSION drift apart.
RUN --mount=type=bind,from=t3code-package,source=/usr/local/include/node/node_version.h,target=/tmp/npm-node-version.h \
    want=$(awk '$1 == "#define" && $2 == "NODE_MODULE_VERSION" && $3 ~ /^[0-9]+$/ {print $3}' /tmp/npm-node-version.h) && \
    have=$(node -p process.versions.modules) && \
    { [ "$want" = "$have" ] || { echo "npm build Node ABI $want != parent Node ABI $have" >&2; exit 1; }; }
ARG T3CODE_VERSION
LABEL io.github.hambn.containers.tool.t3code.version="${T3CODE_VERSION}"
USER sysadmin
WORKDIR /workspace
EXPOSE 3773
ENTRYPOINT ["t3", "serve", "--host=0.0.0.0", "--port=3773"]
