# syntax=docker/dockerfile:1
ARG DISTRO

FROM base AS build-ubuntu

# google-re2 (via cel-python) has no musllinux wheels, so it compiles against re2 on Alpine.
FROM base AS build-alpine
USER root
ARG OS_REFRESH
RUN apk add --no-cache abseil-cpp-dev py3-pybind11-dev python3-dev re2-dev

FROM build-${DISTRO} AS build
USER root
ARG OMNIGENT_VERSION
RUN UV_TOOL_DIR=/opt/uv-tools UV_TOOL_BIN_DIR=/out/usr/local/bin uv tool install --no-cache --python python3 \
        "omnigent==${OMNIGENT_VERSION}"

FROM base AS payload-ubuntu

FROM base AS payload-alpine
USER root
ARG OS_REFRESH
RUN apk add --no-cache re2

FROM payload-${DISTRO} AS payload
USER root
COPY --link --from=build /opt/uv-tools/omnigent/ /opt/uv-tools/omnigent/
COPY --link --from=build /out/ /

FROM payload AS image
COPY --link --from=devbox-config / /
USER sysadmin
WORKDIR /workspace
ENTRYPOINT ["omnigent"]
