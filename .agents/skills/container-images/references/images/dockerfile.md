# Dockerfile authoring

One `Dockerfile` per tool at `tools/<category>/<tool>/Dockerfile`. Its variants are
listed in the tool's `docker-bake.hcl`, and a plain `docker build tools/<category>/<tool>`
builds the default variant. The first line is `# syntax=docker/dockerfile:1`, followed by
a comment saying which variant the defaults build.

## Bases and inputs

- Every pin is a global `ARG` with a default, preceded by its `# renovate:` comment
  ([versions and pins](../versions.md)): external base images as `ALPINE_IMAGE`,
  `UBUNTU_IMAGE`, `WOLFI_IMAGE`, or `HEADLESS_SHELL_IMAGE` (`name:tag@sha256:…`), and
  versions as `<NAME>_VERSION`. Redeclare each in the stage that uses it. Never
  hard-code an image reference or version elsewhere.
- The parent tier is the published image in `ARG BASE_IMAGE` (for example
  `ghcr.io/hambn/devbox:ubuntu-browser`), defaulting to the default variant's parent.
  The bake file sets it per variant, and CI pins it to a digest.
- Other args: `DISTRO` (where stages differ per distro) and `OS_REFRESH` (where OS
  packages are installed). Neither needs a Renovate comment.

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

## Layering

- Devbox keeps each tier's heavy layers in a `<tier>-payload` stage that sets every
  `ENV` descendants need, and its published `lite`, `full`, and `browser` stages copy the
  `rootfs/` config layer last with `COPY --link --from=config / /`, so a config change
  rebuilds only that layer.
- Agent Dockerfiles build on the published parent and add only their tool:

```dockerfile
# syntax=docker/dockerfile:1
# docker build tools/ai/<tool> builds the ubuntu-browser variant; the other variants
# only change BASE_IMAGE (see docker-bake.hcl). CI pins the base tag to its digest.
ARG BASE_IMAGE=ghcr.io/hambn/devbox:ubuntu-browser
# renovate: datasource=npm depName=<package>
ARG <TOOL>_VERSION=<version>

FROM ${BASE_IMAGE}
ARG <TOOL>_VERSION
USER root
RUN <install the pinned tool>
LABEL io.github.hambn.containers.tool.<tool>.version="${<TOOL>_VERSION}"
USER sysadmin
WORKDIR /workspace
ENTRYPOINT ["<cli>"]
```

agentbloat ends with a login-zsh `CMD` and no entrypoint, and omnigent and t3code build
on it. Do not leave a stray `CMD []`.

## Runtime and security

- Elevate to root only for installation; end as the tier's user (`65532:65532` for core,
  `sysadmin` otherwise).
- Make installed launchers readable and executable by any non-root UID.
- Devbox gives runtime npm global installs a writable `sysadmin` prefix. Keep pinned
  npm packages in the image's system prefix by passing `--prefix=/usr/local` to every
  Dockerfile `npm install -g`, including in descendant agent images.
- Never bake credentials, tokens, or build-host state into a layer; secrets arrive at
  runtime.
- Clean caches in the `RUN` that created them.
- Mark a deliberate temporary limitation with a `# ponytail:` comment
  ([tool-specific contracts](../tool-specific-contracts.md)).

Validate statically with `docker buildx bake --print` in the tool directory and the
`$repository-changes` validator; runtime behavior is proven by the tests CI runs
([testing](../testing.md)).
