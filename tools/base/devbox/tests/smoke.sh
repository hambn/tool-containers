#!/usr/bin/env bash
# Usage: smoke.sh IMAGE_REF  (CI exports DISTRO and TIER)
set -euo pipefail

image=$1

docker run --rm "$image" /bin/zsh -lic '
    set -eu
    test "$PWD" = /home/sysadmin
    [[ ":$PATH:" = *":$HOME/.local/bin:"* ]]
    test -w "$HOME" -a -w "$XDG_RUNTIME_DIR"
    test -r "$ZDOTDIR/.zshenv" -a -r "$ZDOTDIR/.zshrc" -a -r "$ZDOTDIR/.zprofile"
    (( ${+functions[_zsh_autosuggest_start]} ))
    [[ -z ${BROWSER_BIN-} ]] || test -x "$BROWSER_BIN"
'

if [[ $TIER != lite ]]; then
    docker run --rm \
        --group-add "$(stat -c %g /var/run/docker.sock)" \
        --volume /var/run/docker.sock:/var/run/docker.sock \
        "$image" /bin/zsh -lc 'set -e; docker version; docker info --format "{{.ServerVersion}}"; docker buildx ls'
fi

if [[ $DISTRO == ubuntu && $TIER != lite ]]; then
    container=$(docker run --detach --privileged --cgroupns=private \
        --user root --tmpfs /run --tmpfs /run/lock \
        --entrypoint /sbin/init "$image")
    trap 'docker rm --force "$container" >/dev/null 2>&1 || true' EXIT

    # Under QEMU user emulation, early-boot units such as systemd-sysctl,
    # systemd-sysusers, and systemd-tmpfiles fail and boot is much slower, so a
    # foreign architecture only has to bring up systemd and journald.
    host_arch=$(docker info --format '{{.Architecture}}' | sed 's/x86_64/amd64/; s/aarch64/arm64/')
    emulated=false
    [[ ${ARCH-$host_arch} == "$host_arch" ]] || emulated=true

    state=starting
    for _ in {1..180}; do
        state=$(docker exec "$container" systemctl is-system-running 2>/dev/null || true)
        [[ $state == running || $state == degraded ]] && break
        [[ $emulated == true && $state == starting ]] &&
            docker exec "$container" systemctl is-active --quiet systemd-journald.service &&
            break
        sleep 1
    done
    echo "systemd state: ${state:-unknown} (arch ${ARCH-$host_arch}, host $host_arch, emulated $emulated)"

    if [[ $emulated == true ]]; then
        if [[ $state != running && $state != degraded && $state != starting ]]; then
            docker exec "$container" systemctl --failed --no-legend --plain || true
            exit 1
        fi
        docker exec "$container" systemctl is-active --quiet systemd-journald.service
    else
        if [[ $state != running ]]; then
            docker exec "$container" systemctl --failed --no-legend --plain || true
            docker logs "$container" || true
            exit 1
        fi
        test -z "$(docker exec "$container" systemctl --failed --no-legend --plain)"
        docker exec "$container" systemctl is-active --quiet systemd-journald.service
        docker exec "$container" test -e /run/user/1000
    fi
fi
