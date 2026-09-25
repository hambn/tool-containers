#!/usr/bin/env bash
# Publish the planned Bake targets: merge each target's per-arch digests into a
# multi-arch index on GHCR, copy that index to Docker Hub, verify every moving tag on
# both, and sign it. Targets without a digest for every architecture (their tool
# failed) are skipped, and so is a target that fails to publish; the script fails at
# the end if any were.
# Usage: publish.sh <digest-dir> <subjects-file>. Requires TARGETS (JSON list),
# registry logins, and cosign. Appends "<hex digest>  <image name>" lines for the
# provenance attestation to <subjects-file>.
set -euo pipefail
shopt -s inherit_errexit

digest_dir=$1
subjects=$2
architectures=(amd64 arm64)
bake=("${BASH_SOURCE[0]%/*}/bake.sh")
selected=$(jq -er '.[]' <<<"${TARGETS:?TARGETS must be a JSON array}")
mapfile -t targets <<<"$selected"
definition=$("${bake[@]}" --print "${targets[@]}")
moving=$(TAG_SET=moving "${bake[@]}" --print "${targets[@]}")
immutable=$(TAG_SET=immutable "${bake[@]}" --print "${targets[@]}")

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

# tags <definition> <target> <registry namespace>
tags() {
    jq -r --arg t "$2" --arg r "$3" '.target[$t].tags[] | select(startswith($r + "/"))' <<<"$1"
}

# Prints the moving tags plus the immutable tags that do not exist yet: immutable
# tags are never repointed.
publish_tags() {
    local target=$1 registry=$2 ref
    tags "$moving" "$target" "$registry"
    for ref in $(tags "$immutable" "$target" "$registry"); do
        if [ "$(registry_digest "$ref")" = missing ]; then
            echo "$ref"
        else
            echo "::notice::$ref already exists; left unchanged" >&2
        fi
    done
}

# verify <digest> <ref>...
verify() {
    local digest=$1 ref status=0
    shift
    for ref; do
        if [ "$(registry_digest "$ref")" != "$digest" ]; then
            echo "::warning::$ref does not resolve to $digest"
            status=1
        fi
    done
    return "$status"
}

publish() {
    local target=$1 arch attempt digest
    repo=$(jq -r --arg t "$target" '.target[$t].tags[0] | split("/")[-1] | split(":")[0]' <<<"$definition")
    ghcr=ghcr.io/hambn/$repo
    hub=docker.io/hambn/$repo
    annotation_list=$(jq -r --arg t "$target" \
        '.target[$t].labels | to_entries[] | "--annotation=index:\(.key)=\(.value)"' <<<"$definition")
    mapfile -t annotations <<<"$annotation_list"
    sources=()
    for arch in "${architectures[@]}"; do
        sources+=("$ghcr@$(cat "$digest_dir/$target-$arch")")
    done

    echo "::group::Publish $target"
    ghcr_list=$(publish_tags "$target" ghcr.io/hambn)
    mapfile -t ghcr_tags <<<"$ghcr_list"
    moving_list=$(tags "$moving" "$target" ghcr.io/hambn)
    mapfile -t moving_ghcr <<<"$moving_list"
    docker buildx imagetools create "${annotations[@]}" "${ghcr_tags[@]/#/--tag=}" "${sources[@]}"
    digest=$(registry_digest "${moving_ghcr[0]}")
    [[ "$digest" =~ ^sha256:[0-9a-f]{64}$ ]]
    echo "$target -> $ghcr@$digest"
    verify "$digest" "${moving_ghcr[@]}"

    hub_list=$(publish_tags "$target" docker.io/hambn)
    mapfile -t hub_tags <<<"$hub_list"
    moving_list=$(tags "$moving" "$target" docker.io/hambn)
    mapfile -t moving_hub <<<"$moving_list"
    for attempt in 1 2 3; do
        docker buildx imagetools create "${hub_tags[@]/#/--tag=}" "$ghcr@$digest"
        if verify "$digest" "${moving_hub[@]}"; then
            break
        fi
        [ "$attempt" -lt 3 ] || {
            echo "Docker Hub tags for $hub do not match $digest" >&2
            return 1
        }
        sleep $((attempt * 10))
    done

    cosign sign --yes "$ghcr@$digest" "$hub@$digest"
    printf '%s  %s\n' "${digest#sha256:}" "$ghcr" "${digest#sha256:}" "index.docker.io/hambn/$repo" >>"$subjects"
    echo "::endgroup::"
}

failed=()
for target in "${targets[@]}"; do
    for arch in "${architectures[@]}"; do
        if [ ! -s "$digest_dir/$target-$arch" ]; then
            echo "::error::$target has no $arch digest; not published"
            failed+=("$target")
            continue 2
        fi
    done
    # A subshell with its own errexit isolates each target; `if ! (...)` would disable it.
    set +e
    (set -e; publish "$target")
    status=$?
    set -e
    if [ "$status" -ne 0 ]; then
        echo "::error::$target failed to publish"
        failed+=("$target")
    fi
done
[ "${#failed[@]}" -eq 0 ] || exit 1
