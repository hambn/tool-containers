# Dockerfile authoring

Keep one Dockerfile per published profile with an explicit Dockerfile syntax directive. Read its catalog entry before editing the context, build arguments, or parent. Declare build arguments close to the steps that use them, so a CLI release does not invalidate earlier package layers. Put browser and presentation additions late. Use bind mounts for build-only scripts and `COPY --link` only where its destination and symlink behavior are tested.

Minimal and core foundations end as UID/GID 1000. Full workspaces and agents end as the inherited `sysadmin` user or UID/GID 1000. Every profile is smoke-tested as non-root. Minimal images expose a POSIX shell and curl; do not add development tools there. Agent images work in `/workspace` and do not inherit styled Zsh.

CI resolves upstream versions and external bases, passes exact build arguments, and records them in OCI metadata. Keep direct-build defaults usable. Pair apt update and install in one step, clean package indexes, and verify downloaded binaries against upstream checksums where available. Never put secrets or local state in layers. A syntax check does not replace a runtime smoke test.
