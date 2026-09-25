# syntax=docker/dockerfile:1
ARG RUNTIME_BASE=docker.io/library/alpine:3.21
FROM ${RUNTIME_BASE}

ARG REFRESH_WEEK=manual
RUN test -n "$REFRESH_WEEK" && \
    apk add --no-cache ca-certificates curl && \
    addgroup -g 1000 sysadmin && \
    adduser -D -u 1000 -G sysadmin -h /home/sysadmin sysadmin

ENV HOME=/home/sysadmin
USER 1000:1000
WORKDIR /home/sysadmin
CMD ["/bin/sh"]
