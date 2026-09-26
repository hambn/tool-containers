# syntax=docker/dockerfile:1
# Build one distribution: docker build --build-arg DISTRO=alpine tools/base/core
ARG DISTRO=wolfi

# renovate: datasource=docker depName=docker.io/library/alpine
ARG ALPINE_IMAGE=docker.io/library/alpine:3.24@sha256:294b683cb724975bec92580e1e685676bd4b50bda910ddb8c51d4cabeaec77e6
# renovate: datasource=docker depName=docker.io/library/ubuntu
ARG UBUNTU_IMAGE=docker.io/library/ubuntu:24.04@sha256:008173c23f95b170204355c12626cb5a965d779a7e1283b09e9cffbb1bf33ca3
# renovate: datasource=docker depName=docker.io/chainguard/wolfi-base
ARG WOLFI_IMAGE=docker.io/chainguard/wolfi-base:latest@sha256:fac38d12efdb4bf43ac9e599a31db10a27ad5dd71e5f1618790962eda8d66180

# Changing this date rebuilds the OS package layers; maintenance.yml bumps it when
# published images have fixable OS vulnerabilities.
ARG OS_REFRESH=2026-09-25

FROM ${ALPINE_IMAGE} AS alpine-payload
ARG OS_REFRESH
RUN apk add --no-cache bash ca-certificates curl tzdata \
    && addgroup -g 65532 nonroot \
    && adduser -D -u 65532 -G nonroot -h /home/nonroot -s /bin/bash nonroot

FROM ${UBUNTU_IMAGE} AS ubuntu-payload
ARG OS_REFRESH
RUN apt-get update \
    && DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends ca-certificates curl tzdata \
    && rm -rf /var/lib/apt/lists/* \
    && userdel --remove ubuntu \
    && groupadd -g 65532 nonroot \
    && useradd -m -u 65532 -g nonroot -d /home/nonroot -s /bin/bash nonroot

# wolfi-base may already ship the nonroot account.
FROM ${WOLFI_IMAGE} AS wolfi-payload
ARG OS_REFRESH
RUN apk add --no-cache bash ca-certificates-bundle curl tzdata \
    && { grep -q '^nonroot:' /etc/group || addgroup -g 65532 nonroot; } \
    && { grep -q '^nonroot:' /etc/passwd || adduser -D -u 65532 -G nonroot -h /home/nonroot -s /bin/bash nonroot; } \
    && test "$(id -u nonroot):$(id -g nonroot)" = 65532:65532 \
    && mkdir -p /home/nonroot \
    && chown 65532:65532 /home/nonroot

FROM ${DISTRO}-payload AS core
RUN find / -xdev -type f \( -perm -4000 -o -perm -2000 \) -exec chmod a-s {} + \
    && rm -rf /usr/share/doc/* /usr/share/man/* /usr/share/info/* /var/cache/apk/* /var/cache/apt/* /var/log/apt /tmp/* /root/.cache
USER 65532:65532
WORKDIR /home/nonroot
CMD ["bash"]
