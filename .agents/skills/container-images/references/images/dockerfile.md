# Dockerfile authoring

Keep one Dockerfile per buildable variant. Derived tools build with the variant directory
as context; do not `COPY` files from another directory. `base/agentimg` alone uses the
shared `images/` context for its flat Dockerfiles and common assets.

## Bases and versions

- Declare a global `ARG BASE_IMAGE` before `FROM` in derived images and use
  `FROM ${BASE_IMAGE}`. Foundation variants use global `RUNTIME_BASE` and, for a
  multi-stage browser source, `BROWSER_BASE`.
- Give direct-build defaults a usable supported reference; keep digest-pinned defaults
  where the repository's air-gapped/direct-build contract depends on reproducibility.
- Pass upstream tool versions as build arguments with a usable default. CI resolves
  release versions and digest-pinned bases.
- State the functional profile and chosen base in the opening comment. Keep dependency
  versions visible to the repository's updater.

## Layers and installation

- Put stable layers before frequently changing tool installation.
- Group related package operations and clean caches in the same `RUN`: use
  `apk add --no-cache`, remove `/var/lib/apt/lists/*`, and clear package-manager caches
  that otherwise persist.
- Verify downloaded binaries with authoritative checksums or signatures when available.
- Install only the profile's required capabilities; inherit shared Node and development
  tools from `agentimg` rather than reinstalling them downstream.

## Runtime and security

- Elevate to root only for build-time installation. Every current image must end with
  `USER sysadmin`. Derived tool images end with `WORKDIR /workspace`; the Agentimg
  foundation keeps `WORKDIR /home/sysadmin` while deployments mount work at `/workspace`.
- Preserve the inherited UID/GID-1000 user and make installed launchers readable and
  executable by non-root users.
- Never bake credentials, tokens, private configuration, or build-host state into a
  layer. Accept secrets at runtime through environment variables, mounted files, or the
  platform secret store.
- Keep entrypoint and command behavior compatible with interactive and deployment use;
  pass user arguments through where the tool supports them.
- Mark only deliberate upgradeable limitations with a `# ponytail:` comment and state
  the path to removal.

Validate syntax with the correct build context and arguments. When layers or runtime
behavior change, build at least one representative distro/profile and smoke-test the
installed command as `sysadmin`; cover every affected variant when behavior differs.
