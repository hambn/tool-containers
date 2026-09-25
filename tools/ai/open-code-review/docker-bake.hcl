# Variants of open-code-review. Run from this directory:
#   docker buildx bake                    # build every variant
#   docker buildx bake open-code-review-ubuntu   # build one variant
#   docker buildx bake --print            # show what would be built
# CI builds one variant per job from this file and pins BASE_IMAGE to a digest; see
# .github/workflows/_image.yml.

target "open-code-review" {
  name    = "open-code-review-${v.variant}"
  matrix  = {
    v = [
      { variant = "ubuntu", distro = "ubuntu", tier = "agent", base = "ghcr.io/hambn/devbox:ubuntu-full" },
      { variant = "alpine", distro = "alpine", tier = "agent", base = "ghcr.io/hambn/devbox:alpine-full" },
      { variant = "ubuntu-browser", distro = "ubuntu", tier = "agent", base = "ghcr.io/hambn/devbox:ubuntu-browser" },
      { variant = "alpine-browser", distro = "alpine", tier = "agent", base = "ghcr.io/hambn/devbox:alpine-browser" },
    ]
  }
  context = "."
  tags    = ["tool-containers/open-code-review:${v.variant}"]
  args = {
    BASE_IMAGE = v.base
  }
  labels = {
    "org.opencontainers.image.title"         = "open-code-review"
    "org.opencontainers.image.description"   = "Alibaba Open Code Review CLI on devbox"
    "org.opencontainers.image.documentation" = "https://github.com/hambn/tool-containers/tree/main/tools/ai/open-code-review"
    "io.github.hambn.containers.variant"     = v.variant
    "io.github.hambn.containers.distro"      = v.distro
    "io.github.hambn.containers.tier"        = v.tier
  }
}

group "default" {
  targets = ["open-code-review"]
}
