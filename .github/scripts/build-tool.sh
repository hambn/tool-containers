#!/usr/bin/env bash
# Build and test every selected variant and architecture of one tool on one runner.
# QEMU/binfmt, Buildx, container-structure-test, and Trivy are installed by images.yml.
set -euo pipefail

selected=$(jq -er 'if type == "array" and length > 0 and all(.[]; type == "string" and test("^[a-z0-9][a-z0-9-]*$")) then .[] else error("expected nonempty Bake target list") end' <<<"${TARGETS:?TARGETS must be a JSON array}")
mapfile -t targets <<<"$selected"
bake=(docker buildx bake -f docker-bake.hcl -f versions.hcl)
result_dir=${RESULT_DIR:-/tmp/image-results}
mkdir -p "$result_dir/digests" "$result_dir/sarif"

# Match the existing image scan policy. Upstream binary findings stay in SARIF;
# the gate excludes binaries that need an upstream release to fix them.
skip_files=(
    '**/usr/local/bin/gh' '**/usr/local/bin/glab' '**/usr/local/bin/helm'
    '**/usr/local/bin/kubectl' '**/usr/local/bin/kustomize' '**/usr/local/bin/yq'
    '**/usr/local/bin/uv' '**/usr/local/bin/uvx' '**/usr/local/bin/node'
    '**/usr/local/lib/node_modules/npm/node_modules/**'
    '**/usr/local/bin/tailscale' '**/usr/local/sbin/tailscaled' '**/usr/local/go/**'
    '**/usr/local/lib/node_modules/@github/copilot/**'
    '**/usr/local/lib/node_modules/@alibaba-group/**'
)
scan_exclusions=()
for file in "${skip_files[@]}"; do scan_exclusions+=(--skip-files "$file"); done

for target in "${targets[@]}"; do
    definition=$("${bake[@]}" --print "$target")
    tool_dir=$(jq -er --arg t "$target" '.target[$t].context' <<<"$definition")
    repo=$(jq -er --arg t "$target" '.target[$t].tags[0] | split("/")[-1] | split(":")[0]' <<<"$definition")
    DISTRO=$(jq -er --arg t "$target" '.target[$t].labels["io.github.hambn.containers.distro"]' <<<"$definition")
    TIER=$(jq -er --arg t "$target" '.target[$t].labels["io.github.hambn.containers.tier"]' <<<"$definition")
    VARIANT=$(jq -er --arg t "$target" '.target[$t].labels["io.github.hambn.containers.variant"]' <<<"$definition")
    export DISTRO TIER VARIANT
    configs=(--config "$tool_dir/tests/structure.yaml")
    test -f "$tool_dir/tests/structure.yaml"
    for name in $(printf '%s\n' "$DISTRO" "$TIER" "$VARIANT" | awk '!seen[$0]++'); do
        file="$tool_dir/tests/structure-$name.yaml"
        if [ -f "$file" ]; then configs+=(--config "$file"); fi
    done

    for arch in amd64 arm64; do
        export ARCH=$arch PLATFORM=linux/$arch DOCKER_DEFAULT_PLATFORM=linux/$arch
        image="local/$target:$arch-test"
        echo "::group::$target ($arch): build"
        cache=()
        if [ "${PR_BUILD:-false}" = true ]; then
            cache+=(--set "$target.cache-from+=type=gha,version=2,scope=$target-$arch")
            cache+=(--set "$target.cache-to=type=gha,version=2,scope=$target-$arch,mode=max,timeout=5m,ignore-error=true")
        fi
        timeout --signal=TERM --kill-after=30s 45m "${bake[@]}" "$target" "${cache[@]}" \
            --provenance=false \
            --set "$target.output=type=docker,rewrite-timestamp=true" \
            --set "$target.tags=$image"
        echo "::endgroup::"

        echo "::group::$target ($arch): test"
        timeout --signal=TERM --kill-after=30s 5m container-structure-test test \
            --image "$image" --platform "$PLATFORM" "${configs[@]}"
        if [ -x "$tool_dir/tests/smoke.sh" ]; then
            timeout --signal=TERM --kill-after=30s 5m "$tool_dir/tests/smoke.sh" "$image"
        fi
        echo "::endgroup::"

        if [ "$arch" = amd64 ]; then
            echo "::group::$target: scan"
            scan=(trivy image --image-src docker --scanners "vuln,secret" --ignore-unfixed --ignorefile .trivyignore.yaml --timeout 10m)
            "${scan[@]}" --format sarif --output "$result_dir/sarif/$target.sarif" "$image"
            # Each variant keeps its own code-scanning identity within this tool job.
            report="$result_dir/sarif/$target.sarif"
            jq --arg id "trivy-$target/" '.runs[].automationDetails.id = $id' "$report" >"$report.tmp"
            mv "$report.tmp" "$report"
            "${scan[@]}" --severity "HIGH,CRITICAL" --exit-code 1 "${scan_exclusions[@]}" "$image"
            echo "::endgroup::"
        fi

        if [ "${PUBLISH:-false}" = true ]; then
            echo "::group::$target ($arch): export verified image"
            CACHE_WRITE=true timeout --signal=TERM --kill-after=30s 30m "${bake[@]}" "$target" \
                --provenance=mode=max --sbom=true \
                --metadata-file "$result_dir/metadata.json" \
                --set "$target.tags=" \
                --set "$target.output=type=image,name=ghcr.io/hambn/$repo,push-by-digest=true,name-canonical=true,push=true,rewrite-timestamp=true"
            digest=$(jq -er --arg t "$target" '.[$t]["containerimage.digest"]' "$result_dir/metadata.json")
            [[ "$digest" =~ ^sha256:[0-9a-f]{64}$ ]]
            printf '%s\n' "$digest" >"$result_dir/digests/$target-$arch"
            echo "::endgroup::"
        fi
        # Keep the shared BuildKit cache, but release each loaded test image.
        docker image rm "$image"
    done
done
