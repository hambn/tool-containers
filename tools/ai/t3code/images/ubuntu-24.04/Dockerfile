# syntax=docker/dockerfile:1
ARG AGENT_BUNDLE_IMAGE=ghcr.io/hambn/agentbloat:ubuntu-24.04
ARG BASE_IMAGE=ghcr.io/hambn/workspace:ubuntu-24.04-core
FROM ${AGENT_BUNDLE_IMAGE} AS agents
FROM ${BASE_IMAGE}
USER root
ENV HOME=/root

COPY --link --from=agents /opt/agent-bundle /opt/agent-bundle
ARG T3_VERSION=latest
RUN npm install --global --no-fund --no-audit "t3@${T3_VERSION}" && \
    npm cache clean --force

ENV PATH=/opt/agent-bundle/bin:/opt/agent-bundle/node_modules/.bin:$PATH
ENV HOME=/home/sysadmin
USER sysadmin
WORKDIR /workspace
EXPOSE 3773
ENTRYPOINT ["t3", "serve", "--host=0.0.0.0", "--port=3773"]
