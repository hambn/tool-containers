# ubuntu-browser: T3 Code on the Ubuntu browser-enabled agentbloat foundation.
FROM ghcr.io/hambn/agentbloat:ubuntu-browser

ARG T3_VERSION=latest

RUN npm install --global --no-fund --no-audit "t3@${T3_VERSION}" && \
    npm cache clean --force

WORKDIR /workspace
EXPOSE 3773
ENTRYPOINT ["t3", "serve", "--host=0.0.0.0", "--port=3773"]
