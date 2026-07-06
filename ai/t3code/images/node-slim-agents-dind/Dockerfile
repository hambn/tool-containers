# node-slim-agents-dind: node-slim-agents + a full Docker engine (docker-in-docker) so an agent
# can build and run containers from inside this container. Ships dockerd + the docker CLI;
# the entrypoint boots dockerd, materializes Codex api-key auth from env, then starts T3 Code.
# ponytail: DinD needs a privileged container (`docker run --privileged`). Without it dockerd won't
#           start and the agent just gets no Docker — everything else still works. Runs as root
#           because dockerd requires it; this variant is for trusted, isolated hosts only.
ARG NODE_VERSION=22
FROM node:${NODE_VERSION}-slim

ARG T3_VERSION=latest
ARG GH_VERSION=2.96.0
ARG DEBIAN_FRONTEND=noninteractive

# Same toolchain as node-slim-agents, plus docker.io — Debian's dockerd + docker CLI.
# ponytail: compose/buildx aren't packaged in bookworm; docker build/run is enough. Add the
#           plugins from download.docker.com if the agent needs `docker compose`.
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        git ca-certificates curl wget \
        openssh-client rsync \
        ripgrep fd-find \
        python3 python3-pip python3-venv \
        build-essential pkg-config make \
        jq unzip zip xz-utils \
        less vim nano tmux procps \
        iputils-ping iproute2 dnsutils net-tools netcat-openbsd socat \
        tree htop file gnupg sqlite3 \
        bubblewrap tini tzdata \
        docker.io \
        iptables uidmap \
    && curl -fsSLo /tmp/gh.deb "https://github.com/cli/cli/releases/download/v${GH_VERSION}/gh_${GH_VERSION}_linux_amd64.deb" \
    && apt-get install -y --no-install-recommends /tmp/gh.deb \
    && rm -f /tmp/gh.deb \
    && npm install -g \
        t3@${T3_VERSION} \
        @anthropic-ai/claude-code \
        @openai/codex \
        opencode-ai \
    && npm cache clean --force \
    && rm -rf /var/lib/apt/lists/*

# Codex reads auth + config from CODEX_HOME. The entrypoint fills it from env at startup, but only
# if empty — mount this dir to persist a `codex login` or supply your own config.toml (e.g. a
# custom base_url for OpenRouter), and the mounted files win.
ENV CODEX_HOME=/root/.codex
RUN mkdir -p "$CODEX_HOME"

COPY entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh

# dockerd persists images/containers here; declare it so a volume can back it.
VOLUME /var/lib/docker

WORKDIR /workspace
EXPOSE 3773
# tini is PID 1 so dockerd's and the agents' orphaned children get reaped.
ENTRYPOINT ["tini", "--", "/usr/local/bin/entrypoint.sh"]
