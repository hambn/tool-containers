# syntax=docker/dockerfile:1
ARG ALPINE_IMAGE
ARG UBUNTU_IMAGE
ARG WOLFI_IMAGE
ARG DISTRO

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
