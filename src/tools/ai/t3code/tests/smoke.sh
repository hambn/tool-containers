#!/usr/bin/env bash
set -euo pipefail

image=${1:?usage: smoke.sh <image-ref>}
container=$(docker run -d -p 127.0.0.1::3773 "$image")
trap 'docker logs "$container" >&2 || true; docker rm -f "$container" >/dev/null' EXIT

port=$(docker port "$container" 3773/tcp | head -n1 | cut -d: -f2)
# arm64 runs under QEMU in CI, so allow a slow start.
for _ in $(seq 180); do
    if curl -fsS -o /dev/null "http://127.0.0.1:$port/"; then
        echo "t3 serve answered on port $port"
        exit 0
    fi
    sleep 1
done
echo "t3 serve did not answer within 180s" >&2
exit 1
