# Variants of core. Run from this directory:
#   docker buildx bake                    # build every variant
#   docker buildx bake core-alpine        # build one variant
#   docker buildx bake --print            # show what would be built
# CI builds one variant per job from this file; see .github/workflows/_image.yml.

target "core" {
  name    = "core-${distro}"
  matrix  = { distro = ["alpine", "ubuntu", "wolfi"] }
  context = "."
  target  = "core"
  tags    = ["tool-containers/core:${distro}"]
  args    = { DISTRO = distro }
  labels = {
    "org.opencontainers.image.title"         = "core"
    "org.opencontainers.image.description"   = "Hardened ${distro} application base: CA certificates, tzdata, curl, bash, and a nonroot user"
    "org.opencontainers.image.documentation" = "https://github.com/hambn/tool-containers/tree/main/tools/base/core"
    "io.github.hambn.containers.variant"     = distro
    "io.github.hambn.containers.distro"      = distro
    "io.github.hambn.containers.tier"        = "core"
  }
}

group "default" {
  targets = ["core"]
}
