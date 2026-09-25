#!/usr/bin/env bash
# Test and build the selected Bake targets for every architecture, one tool at a
# time, and push each tool's variants by digest when publishing. images.yml runs this
# for every planned job on one runner, emulating the architectures it does not have.
# Nothing here names an image: targets, contexts, tests, and scan exclusions all come
# from the Bake graph and the tool directories.
#
# The architectures of a tool build and test concurrently, each into its own log,
# which is printed once that architecture finishes. A failing tool does not stop the
# tools after it; the script fails at the end, and only tools that passed on every
# architecture leave digests for publish.sh.
#
# Environment: TARGETS (JSON list of Bake targets), ARCHES (space-separated, default
# "amd64 arm64"), SCAN (true/false, scans amd64 only), PUBLISH (true/false),
# RESULT_DIR (reports, digests, and logs).
set -euo pipefail
shopt -s inherit_errexit

selected=$(jq -er 'if type == "array" and length > 0 and all(.[]; type == "string" and test("^[a-z0-9][a-z0-9-]*$")) then .[] else error("expected nonempty Bake target list") end' <<<"${TARGETS:?TARGETS must be a JSON array}")
mapfile -t targets <<<"$selected"
read -ra arches <<<"${ARCHES-amd64 arm64}"
[ "${#arches[@]}" -gt 0 ] || {
    echo "ARCHES must list amd64 and/or arm64" >&2
    exit 1
}
for arch in "${arches[@]}"; do
    case "$arch" in amd64 | arm64) ;; *)
        echo "unsupported architecture: $arch" >&2
        exit 1
        ;;
    esac
done
result_dir=${RESULT_DIR:-/tmp/image-results}
mkdir -p "$result_dir/digests" "$result_dir/sarif" "$result_dir/logs"
bake=("${BASH_SOURCE[0]%/*}/bake.sh")
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

check() {
    local target=$1 tool_dir=$2 image=local/$1:$ARCH
    DISTRO=$(field "$target" '.labels["io.github.hambn.containers.distro"]')
    TIER=$(field "$target" '.labels["io.github.hambn.containers.tier"]')
    VARIANT=$(field "$target" '.labels["io.github.hambn.containers.variant"]')
    export DISTRO TIER VARIANT

    echo "::group::Test $target ($ARCH)"
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

    if [ "${SCAN:-false}" = true ] && [ "$ARCH" = amd64 ]; then
        echo "::group::Scan $target"
        scan=(trivy image --image-src docker --scanners "vuln,secret" --ignore-unfixed --ignorefile tools/trivyignore.yaml --timeout 10m)
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
}

# Build the variants of one tool for one architecture in one Bake call so their shared
# stages build once; the results stay in the BuildKit cache and each variant is loaded
# on its own to test.
verify_arch() {
    local tool_dir=$1 build=()
    export ARCH=$2 PLATFORM=linux/$2
    shift 2
    for target; do build+=(--set "$target.output=type=cacheonly"); done
    echo "::group::Build $tool_dir ($ARCH)"
    "${bake[@]}" --provenance=false "${build[@]}" "$@"
    echo "::endgroup::"
    for target; do check "$target" "$tool_dir"; done
}

# Push the variants by digest from the same cache with provenance and SBOM;
# publish.sh later joins the architectures into one tagged index.
push_arch() {
    local tool_dir=$1 push=() metadata=$result_dir/metadata-$2.json
    export ARCH=$2 PLATFORM=linux/$2
    shift 2
    for target; do
        push+=(--set "$target.tags=")
        push+=(--set "$target.output=type=image,name=$(field "$target" '.tags[0] | sub(":[^:/]+$"; "")'),push-by-digest=true,name-canonical=true,push=true,rewrite-timestamp=true")
    done
    echo "::group::Push $tool_dir ($ARCH) by digest"
    CACHE_WRITE=true "${bake[@]}" --provenance=mode=max --sbom=true \
        --metadata-file "$metadata" "${push[@]}" "$@"
    echo "::endgroup::"
    for target; do
        digest=$(jq -er --arg t "$target" '.[$t]["containerimage.digest"]' "$metadata")
        [[ "$digest" =~ ^sha256:[0-9a-f]{64}$ ]]
        printf '%s\n' "$digest" >"$result_dir/digests/$target-$ARCH"
    done
}

# each_arch <step> <tool dir> <target>...: run the step for every architecture at
# once, then print each log as its architecture finishes. Fails if any failed.
each_arch() {
    local step=$1 tool_dir=$2 arch pids=() status=0 index log
    shift 2
    for arch in "${arches[@]}"; do
        log=$result_dir/logs/${tool_dir//\//-}-$step-$arch.log
        (
            set -e
            "$step" "$tool_dir" "$arch" "$@"
        ) >"$log" 2>&1 &
        pids+=("$!")
    done
    for index in "${!arches[@]}"; do
        arch=${arches[$index]}
        if wait "${pids[$index]}"; then
            echo "$tool_dir: $step passed on $arch"
        else
            echo "::error::$tool_dir failed on $arch"
            status=1
        fi
        cat "$result_dir/logs/${tool_dir//\//-}-$step-$arch.log"
    done
    return "$status"
}

# Push only once every variant passed on every architecture.
tool() {
    each_arch verify_arch "$@"
    [ "${PUBLISH:-false}" = true ] || return 0
    each_arch push_arch "$@"
}

declare -A variants=()
tools=()
for target in "${targets[@]}"; do
    dir=$(field "$target" .context)
    [ -n "${variants[$dir]:-}" ] || tools+=("$dir")
    variants[$dir]+=" $target"
done

failed=()
for dir in "${tools[@]}"; do
    # A subshell with its own errexit isolates each tool; `if ! (...)` would disable it.
    set +e
    # shellcheck disable=SC2086 # Target names are validated above.
    (
        set -e
        tool "$dir" ${variants[$dir]}
    )
    status=$?
    set -e
    if [ "$status" -ne 0 ]; then
        echo "::error::$dir failed"
        failed+=("$dir")
    fi
    # Keep the cache of shared stages for the next tool while leaving disk to build it.
    if [ "${#tools[@]}" -gt 1 ]; then docker buildx prune --force --min-free-space 10gb >/dev/null; fi
done
[ "${#failed[@]}" -eq 0 ] || exit 1
