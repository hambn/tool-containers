#!/usr/bin/env bash
# Publish one bake target: merge its per-arch digests into a multi-arch index on
# GHCR, copy that index to Docker Hub, and verify every moving tag on both.
# Usage: publish.sh <target> <digest-dir>. Requires the bake-env.sh variables and
# registry logins. Writes digest=<index digest> and repo=<name> to GITHUB_OUTPUT.
set -euo pipefail
shopt -s inherit_errexit

target=$1
digest_dir=$2
bake=(docker buildx bake -f docker-bake.hcl -f versions.hcl)

# Prints the digest of a reference, or "missing" when the registry reports that it
# does not exist. Other failures are retried, then fail.
registry_digest() {
    local ref=$1 output attempt
    for attempt in 1 2 3; do
        if output=$(docker buildx imagetools inspect "$ref" --format '{{json .Manifest}}' 2>&1); then
            jq -r .digest <<<"$output"
            return 0
        fi
        if grep -Eiq 'manifest[[:space:]]+unknown|MANIFEST_UNKNOWN|NAME_UNKNOWN|status code: 404|404 Not Found' <<<"$output"; then
            echo missing
            return 0
        fi
        [ "$attempt" -lt 3 ] && sleep $((attempt * 5))
    done
    echo "Registry inspection failed for $ref: $output" >&2
    return 1
}

tags() {
    TAG_SET=$1 "${bake[@]}" --print "$target" | jq -r --arg t "$target" --arg r "$2" \
        '.target[$t].tags[] | select(startswith($r + "/"))'
}

definition=$("${bake[@]}" --print "$target")
repo=$(jq -r --arg t "$target" '.target[$t].tags[0] | split("/")[-1] | split(":")[0]' <<<"$definition")
ghcr=ghcr.io/hambn/$repo
hub=docker.io/hambn/$repo

annotation_list=$(jq -r --arg t "$target" \
    '.target[$t].labels | to_entries[] | "--annotation=index:\(.key)=\(.value)"' <<<"$definition")
mapfile -t annotations <<<"$annotation_list"
sources=()
for arch in amd64 arm64; do
    sources+=("$ghcr@$(cat "$digest_dir/$target-$arch")")
done

# Prints the moving tags plus the immutable tags that do not exist yet: immutable
# tags are never repointed.
publish_tags() {
    local registry=$1 ref state moving immutable
    moving=$(tags moving "$registry")
    immutable=$(tags immutable "$registry")
    echo "$moving"
    for ref in $immutable; do
        state=$(registry_digest "$ref")
        if [ "$state" = missing ]; then
            echo "$ref"
        else
            echo "::notice::$ref already exists; left unchanged" >&2
        fi
    done
}

ghcr_list=$(publish_tags ghcr.io/hambn)
mapfile -t ghcr_tags <<<"$ghcr_list"
moving_list=$(tags moving ghcr.io/hambn)
mapfile -t moving_ghcr <<<"$moving_list"
docker buildx imagetools create "${annotations[@]}" "${ghcr_tags[@]/#/--tag=}" "${sources[@]}"
digest=$(registry_digest "${moving_ghcr[0]}")
[[ "$digest" =~ ^sha256:[0-9a-f]{64}$ ]]
echo "$target -> $ghcr@$digest"

hub_list=$(publish_tags docker.io/hambn)
mapfile -t hub_tags <<<"$hub_list"
moving_list=$(tags moving docker.io/hambn)
mapfile -t moving_hub <<<"$moving_list"

verify() {
    local ref actual status=0
    for ref in "$@"; do
        actual=$(registry_digest "$ref")
        if [ "$actual" != "$digest" ]; then
            echo "::warning::$ref does not resolve to $digest"
            status=1
        fi
    done
    return "$status"
}

verify "${moving_ghcr[@]}"
for attempt in 1 2 3; do
    docker buildx imagetools create "${hub_tags[@]/#/--tag=}" "$ghcr@$digest"
    if verify "${moving_hub[@]}"; then
        break
    fi
    [ "$attempt" -lt 3 ] || {
        echo "Docker Hub tags for $hub do not match $digest" >&2
        exit 1
    }
    sleep $((attempt * 10))
done

{
    echo "repo=$repo"
    echo "digest=$digest"
} >>"${GITHUB_OUTPUT:-/dev/stdout}"
