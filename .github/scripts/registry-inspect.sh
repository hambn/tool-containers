#!/usr/bin/env bash

# Registry reads are retried, and only an explicit not-found response is treated
# as a missing image. Authentication, transport, and registry-server failures stop
# planning instead of silently selecting no variants.
registry_inspect() {
  local ref="$1" format="$2" output="" attempt
  for attempt in 1 2 3; do
    if output=$(docker buildx imagetools inspect "$ref" --format "$format" 2>&1); then
      printf '%s\n' "$output"
      return 0
    fi
    [ "$attempt" -lt 3 ] && sleep $((attempt * 2))
  done
  if grep -Eiq 'manifest[[:space:]]+unknown|MANIFEST_UNKNOWN|NAME_UNKNOWN|status code: 404|404 Not Found' <<<"$output"; then
    printf 'missing\n'
    return 0
  fi
  printf 'Registry inspection failed for %s: %s\n' "$ref" "$output" >&2
  return 1
}
