#!/usr/bin/env bash
# docker buildx bake with the repository's Bake files and the commit-derived
# variables (see tools/docker-bake.hcl). Run from the repository root:
#   .github/scripts/bake.sh --print all
set -euo pipefail

export GIT_SHA=${GIT_SHA:-$(git rev-parse HEAD)}
export SOURCE_DATE_EPOCH=${SOURCE_DATE_EPOCH:-$(git log -1 --format=%ct "$GIT_SHA")}
export BUILD_DATE=${BUILD_DATE:-$(date -u -d "@$SOURCE_DATE_EPOCH" +%Y%m%d)}
export CREATED=${CREATED:-$(date -u -d "@$SOURCE_DATE_EPOCH" +%Y-%m-%dT%H:%M:%SZ)}
exec docker buildx bake -f tools/docker-bake.hcl -f tools/versions.hcl "$@"
