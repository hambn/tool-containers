#!/usr/bin/env bash
# Export the commit-derived bake variables (see docker-bake.hcl) to later steps.
set -euo pipefail

epoch=$(git log -1 --format=%ct)
{
    echo "GIT_SHA=$(git rev-parse HEAD)"
    echo "SOURCE_DATE_EPOCH=$epoch"
    echo "BUILD_DATE=$(date -u -d "@$epoch" +%Y%m%d)"
    echo "CREATED=$(date -u -d "@$epoch" +%Y-%m-%dT%H:%M:%SZ)"
    echo "CACHE_REF=ghcr.io/hambn/buildcache"
} >>"${GITHUB_ENV:-/dev/stdout}"
