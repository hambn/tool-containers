#!/usr/bin/env bash
# Build, test, and scan the selected variants of one tool for one architecture, then
# push them by digest when publishing. images.yml runs this once per tool and native
# runner. Nothing here names an image: targets, contexts, tests, and scan exclusions
# all come from the Bake graph and the tool directories.
#
# Environment: TARGETS (JSON list of Bake targets), ARCH (amd64 or arm64), SCAN,
# PR_BUILD, and PUBLISH (true/false), RESULT_DIR (reports and digests).
set -euo pipefail
shopt -s inherit_errexit

selected=$(jq -er 'if type == "array" and length > 0 and all(.[]; type == "string" and test("^[a-z0-9][a-z0-9-]*$")) then .[] else error("expected nonempty Bake target list") end' <<<"${TARGETS:?TARGETS must be a JSON array}")
mapfile -t targets <<<"$selected"
arch=${ARCH:?ARCH must be amd64 or arm64}
export ARCH PLATFORM=linux/$arch
result_dir=${RESULT_DIR:-/tmp/image-results}
mkdir -p "$result_dir/digests" "$result_dir/sarif"
bake=(docker buildx bake -f docker-bake.hcl -f versions.hcl)
definition=$("${bake[@]}" --print "${targets[@]}")

field() {
    jq -er --arg t "$1" ".target[\$t]$2" <<<"$definition"
}

# Tool directories a target is built from: its own context plus the context of every
# target it consumes through a `target:` context, recursively.
contexts() {
    jq -r --arg t "$1" '. as $bake
        | def chain($name): $name, (($bake.target[$name].contexts // {})[]
            | select(startswith("target:")) | ltrimstr("target:") | chain(.));
        [chain($t) | $bake.target[.].context] | unique[]' <<<"$definition"
}

# Build every variant in one Bake call so shared stages build once and in parallel.
# The results stay in the BuildKit cache; each variant is loaded on its own below.
build=()
for target in "${targets[@]}"; do
    build+=(--set "$target.output=type=cacheonly")
    if [ "${PR_BUILD:-false}" = true ]; then
        build+=(--set "$target.cache-from+=type=gha,version=2,scope=$target-$arch")
        build+=(--set "$target.cache-to=type=gha,version=2,scope=$target-$arch,mode=max,timeout=5m,ignore-error=true")
    fi
done
echo "::group::Build ${targets[*]} ($arch)"
"${bake[@]}" --provenance=false "${build[@]}" "${targets[@]}"
echo "::endgroup::"

for target in "${targets[@]}"; do
    image=local/$target:test
    tool_dir=$(field "$target" .context)
    DISTRO=$(field "$target" '.labels["io.github.hambn.containers.distro"]')
    TIER=$(field "$target" '.labels["io.github.hambn.containers.tier"]')
    VARIANT=$(field "$target" '.labels["io.github.hambn.containers.variant"]')
    export DISTRO TIER VARIANT

    echo "::group::Test $target ($arch)"
    "${bake[@]}" "$target" --provenance=false \
        --set "$target.output=type=docker,rewrite-timestamp=true" \
        --set "$target.tags=$image"
    configs=(--config "$tool_dir/tests/structure.yaml")
    for name in $(printf '%s\n' "$DISTRO" "$TIER" "$VARIANT" | awk '!seen[$0]++'); do
        file="$tool_dir/tests/structure-$name.yaml"
        if [ -f "$file" ]; then configs+=(--config "$file"); fi
    done
    container-structure-test test --image "$image" --platform "$PLATFORM" "${configs[@]}"
    if [ -x "$tool_dir/tests/smoke.sh" ]; then
        "$tool_dir/tests/smoke.sh" "$image"
    fi
    echo "::endgroup::"

    if [ "${SCAN:-false}" = true ]; then
        echo "::group::Scan $target"
        scan=(trivy image --image-src docker --scanners "vuln,secret" --ignore-unfixed --ignorefile .trivyignore.yaml --timeout 10m)
        report="$result_dir/sarif/$target.sarif"
        "${scan[@]}" --format sarif --output "$report" "$image"
        # One code-scanning identity per variant, even though a job uploads several.
        jq --arg id "trivy-$target/" '.runs[].automationDetails.id = $id' "$report" >"$report.tmp"
        mv "$report.tmp" "$report"
        # The gate skips upstream binaries that only a new upstream release can fix
        # (Renovate bumps them); each tool lists its own in tests/trivy-skip-files.txt.
        # The SARIF report above still includes them.
        skips=()
        for dir in $(contexts "$target"); do
            [ -f "$dir/tests/trivy-skip-files.txt" ] || continue
            while read -r pattern _; do
                case "$pattern" in '' | '#'*) continue ;; esac
                skips+=(--skip-files "$pattern")
            done <"$dir/tests/trivy-skip-files.txt"
        done
        "${scan[@]}" --severity "HIGH,CRITICAL" --exit-code 1 "${skips[@]}" "$image"
        echo "::endgroup::"
    fi
    docker image rm "$image" >/dev/null
done

if [ "${PUBLISH:-false}" = true ]; then
    # Every variant passed: push them by digest from the same cache, with provenance
    # and SBOM. publish.sh later joins both architectures into one tagged index.
    push=()
    for target in "${targets[@]}"; do
        name=$(field "$target" '.tags[0] | sub(":[^:/]+$"; "")')
        push+=(--set "$target.tags=")
        push+=(--set "$target.output=type=image,name=$name,push-by-digest=true,name-canonical=true,push=true,rewrite-timestamp=true")
    done
    echo "::group::Push ${targets[*]} ($arch) by digest"
    CACHE_WRITE=true "${bake[@]}" --provenance=mode=max --sbom=true \
        --metadata-file "$result_dir/metadata.json" "${push[@]}" "${targets[@]}"
    echo "::endgroup::"
    for target in "${targets[@]}"; do
        digest=$(jq -er --arg t "$target" '.[$t]["containerimage.digest"]' "$result_dir/metadata.json")
        [[ "$digest" =~ ^sha256:[0-9a-f]{64}$ ]]
        printf '%s\n' "$digest" >"$result_dir/digests/$target-$arch"
    done
fi
