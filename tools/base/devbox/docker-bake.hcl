# Variants of devbox. Run from this directory:
#   docker buildx bake                    # build every variant
#   docker buildx bake devbox-alpine-lite   # build one variant
#   docker buildx bake --print            # show what would be built
# CI builds one variant per job from this file and pins BASE_IMAGE to a digest; see
# .github/workflows/_image.yml.

target "devbox" {
  name    = "devbox-${v.variant}"
  matrix  = {
    v = [
      { variant = "alpine-lite", distro = "alpine", tier = "lite", base = "ghcr.io/hambn/core:alpine" },
      { variant = "alpine-full", distro = "alpine", tier = "full", base = "ghcr.io/hambn/core:alpine" },
      { variant = "alpine-browser", distro = "alpine", tier = "browser", base = "ghcr.io/hambn/core:alpine" },
      { variant = "ubuntu-lite", distro = "ubuntu", tier = "lite", base = "ghcr.io/hambn/core:ubuntu" },
      { variant = "ubuntu-full", distro = "ubuntu", tier = "full", base = "ghcr.io/hambn/core:ubuntu" },
      { variant = "ubuntu-browser", distro = "ubuntu", tier = "browser", base = "ghcr.io/hambn/core:ubuntu" },
    ]
  }
  context = "."
  target  = v.tier
  tags    = ["tool-containers/devbox:${v.variant}"]
  args = {
    BASE_IMAGE = v.base
    DISTRO     = v.distro
  }
  labels = {
    "org.opencontainers.image.title"         = "devbox"
    "org.opencontainers.image.description"   = "Interactive development and CI image with shell, toolchains, and optional browser"
    "org.opencontainers.image.documentation" = "https://github.com/hambn/tool-containers/tree/main/tools/base/devbox"
    "io.github.hambn.containers.variant"     = v.variant
    "io.github.hambn.containers.distro"      = v.distro
    "io.github.hambn.containers.tier"        = v.tier
  }
}

group "default" {
  targets = ["devbox"]
}
