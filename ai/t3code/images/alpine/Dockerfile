# alpine: T3 Code on the Alpine agentbloat foundation, without a browser.
FROM ghcr.io/hambn/agentbloat:alpine

USER root

ARG T3_VERSION=latest

RUN npm install --global --no-fund --no-audit "t3@${T3_VERSION}" && \
    npm cache clean --force

USER agent
WORKDIR /workspace
EXPOSE 3773
ENTRYPOINT ["t3", "serve", "--host=0.0.0.0", "--port=3773"]
