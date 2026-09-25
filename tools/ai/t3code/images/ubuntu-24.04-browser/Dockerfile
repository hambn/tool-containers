# syntax=docker/dockerfile:1
ARG BROWSER_BASE=docker.io/chromedp/headless-shell:stable
ARG BASE_IMAGE=ghcr.io/hambn/t3code:ubuntu-24.04
FROM ${BROWSER_BASE} AS browser
FROM ${BASE_IMAGE}
USER root
ENV HOME=/root

RUN apt-get update && \
    DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends \
      fonts-noto-color-emoji fonts-symbola libgbm1 libglib2.0-0t64 libgtk-3-0t64 \
      libnss3 libx11-6 libxcomposite1 libxdamage1 libxext6 libxi6 libxrandr2 && \
    rm -rf /var/lib/apt/lists/*
COPY --link --from=browser /headless-shell /headless-shell
ENV BROWSER_BIN=/headless-shell/headless-shell PATH=/headless-shell:$PATH
ENV HOME=/home/sysadmin
USER sysadmin
WORKDIR /workspace
EXPOSE 3773
ENTRYPOINT ["t3", "serve", "--host=0.0.0.0", "--port=3773"]
