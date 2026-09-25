# syntax=docker/dockerfile:1
ARG RUNTIME_BASE=docker.io/library/ubuntu:24.04
FROM ${RUNTIME_BASE}

ARG REFRESH_WEEK=manual
RUN test -n "$REFRESH_WEEK" && \
    apt-get update && \
    DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends ca-certificates curl passwd && \
    groupadd --gid 1000 sysadmin && \
    useradd --uid 1000 --gid 1000 --create-home --shell /bin/sh sysadmin && \
    rm -rf /var/lib/apt/lists/*

ENV HOME=/home/sysadmin
USER 1000:1000
WORKDIR /home/sysadmin
CMD ["/bin/sh"]
