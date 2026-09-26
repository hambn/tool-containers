# Variants of omnigent. Run from this directory:
#   docker buildx bake                    # build every variant
#   docker buildx bake omnigent-ubuntu   # build one variant
#   docker buildx bake --print            # show what would be built
# CI builds one variant per job from this file and pins BASE_IMAGE to a digest; see
# .github/workflows/_image.yml.

target "omnigent" {
  name    = "omnigent-${v.variant}"
  matrix  = {
    v = [
      { variant = "ubuntu", distro = "ubuntu", tier = "agent", base = "ghcr.io/hambn/agentbloat:ubuntu" },
      { variant = "alpine", distro = "alpine", tier = "agent", base = "ghcr.io/hambn/agentbloat:alpine" },
      { variant = "ubuntu-browser", distro = "ubuntu", tier = "agent", base = "ghcr.io/hambn/agentbloat:ubuntu-browser" },
      { variant = "alpine-browser", distro = "alpine", tier = "agent", base = "ghcr.io/hambn/agentbloat:alpine-browser" },
    ]
  }
  context = "."
  tags    = ["tool-containers/omnigent:${v.variant}"]
  args = {
    BASE_IMAGE = v.base
    DISTRO     = v.distro
  }
  labels = {
    "org.opencontainers.image.title"         = "omnigent"
    "org.opencontainers.image.description"   = "Omnigent agent meta-harness on agentbloat"
    "org.opencontainers.image.documentation" = "https://github.com/hambn/tool-containers/tree/main/tools/ai/omnigent"
    "io.github.hambn.containers.variant"     = v.variant
    "io.github.hambn.containers.distro"      = v.distro
    "io.github.hambn.containers.tier"        = v.tier
  }
}

group "default" {
  targets = ["omnigent"]
}
