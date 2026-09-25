# Dockerfile authoring

One `Dockerfile` per tool at `tools/<category>/<tool>/Dockerfile`, built only through its
`docker-bake.hcl` target. The first line is `# syntax=docker/dockerfile:1`.

## Bases and inputs

- Reference base images only through global `ARG ALPINE_IMAGE`, `UBUNTU_IMAGE`,
  `WOLFI_IMAGE`, or `HEADLESS_SHELL_IMAGE`. Bake always passes them from `versions.hcl`,
  so they need no defaults. Never hard-code an image reference or digest.
- Parent tiers arrive as named contexts (`FROM core`, `FROM base`,
  `COPY --from=devbox-config`), never as registry references.
- Every version is an `ARG <NAME>_VERSION` without a default, passed from `versions.hcl`
  ([versions and pins](../versions.md)). Declare it in the stage that uses it.
- Build args every target receives: `DISTRO`, `OS_REFRESH`, `SOURCE_DATE_EPOCH`, and the
  base-image args.

## Per-distro stages

Keep distro differences in named stages and select one with the `DISTRO` arg:

```dockerfile
FROM ${ALPINE_IMAGE} AS alpine-os
FROM ${UBUNTU_IMAGE} AS ubuntu-os
FROM ${DISTRO}-os AS os
```

Put only genuinely distro-specific steps in those stages; shared steps follow the
selecting `FROM`.

## OS packages

- Never run `apt-get upgrade`, `dist-upgrade`, or `apk upgrade`. Fresh packages come from
  rebuilding against a newer base digest or from bumping `OS_REFRESH`.
- Declare `ARG OS_REFRESH` in each stage immediately before its package-install `RUN`,
  so bumping it invalidates exactly those layers.
- apt: `apt-get install -y --no-install-recommends` and `rm -rf /var/lib/apt/lists/*` in
  the same `RUN`. apk: `apk add --no-cache`.
- Keep package lists in plain-text files (one name per line, `#` comments allowed) and
  read them with, for example, `grep -v '^\s*\(#\|$\)' file | xargs`.

## Static downloads

Download release binaries in separate fetch stages so they build once on the builder's
platform and cache independently:

```dockerfile
FROM --platform=$BUILDPLATFORM ${ALPINE_IMAGE} AS fetch
RUN apk add --no-cache curl
FROM fetch AS helm
ARG TARGETARCH
ARG HELM_VERSION
RUN <download ${HELM_VERSION} for ${TARGETARCH}, verify the upstream checksum file, write /out/usr/local/bin/helm>
```

Verify every download against the upstream checksum or signature; fail on mismatch.
Write into `/out/<final path>` and merge with `COPY --link --from=<stage> /out/ /`.
Map `TARGETARCH` to upstream asset names explicitly; both amd64 and arm64 must work.

## Payload and config layering

- A tier's heavy layers live in a `payload` stage (`<tier>-payload` in devbox) that sets
  every `ENV` descendants need.
- The published stage copies the config layer last: `COPY --link --from=config / /` in
  devbox, `COPY --link --from=devbox-config / /` in agents. Config changes then rebuild
  only that layer.
- Agent Dockerfiles follow this shape; the published stage is named `image`:

```dockerfile
# syntax=docker/dockerfile:1
FROM base AS payload
ARG DISTRO
ARG <TOOL>_VERSION
USER root
RUN <install the pinned tool>
FROM payload AS image
COPY --link --from=devbox-config / /
USER sysadmin
WORKDIR /workspace
ENTRYPOINT ["<cli>"]
```

agentbloat publishes `image` with a login-zsh `CMD` and no entrypoint, and exposes
`payload` to omnigent and t3code. Do not leave a stray `CMD []`.

## Runtime and security

- Elevate to root only for installation; end as the tier's user (`65532:65532` for core,
  `sysadmin` otherwise).
- Make installed launchers readable and executable by any non-root UID.
- Never bake credentials, tokens, or build-host state into a layer; secrets arrive at
  runtime.
- Clean caches in the `RUN` that created them.
- Mark a deliberate temporary limitation with a `# ponytail:` comment
  ([tool-specific contracts](../tool-specific-contracts.md)).

Validate statically with `docker buildx bake -f docker-bake.hcl -f versions.hcl --print
<target>` and the `$repository-changes` validator; runtime behavior is proven by the tests
CI runs ([testing](../testing.md)).
