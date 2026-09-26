# Variants of t3code. Run from this directory:
#   docker buildx bake                    # build every variant
#   docker buildx bake t3code-ubuntu   # build one variant
#   docker buildx bake --print            # show what would be built
# CI builds one variant per job from this file and pins BASE_IMAGE to a digest; see
# .github/workflows/_image.yml.

target "t3code" {
  name    = "t3code-${v.variant}"
  matrix  = {
    v = [
      { variant = "ubuntu", distro = "ubuntu", tier = "agent", base = "ghcr.io/hambn/agentbloat:ubuntu" },
      { variant = "ubuntu-browser", distro = "ubuntu", tier = "agent", base = "ghcr.io/hambn/agentbloat:ubuntu-browser" },
    ]
  }
  context = "."
  tags    = ["tool-containers/t3code:${v.variant}"]
  args = {
    BASE_IMAGE = v.base
  }
  labels = {
    "org.opencontainers.image.title"         = "t3code"
    "org.opencontainers.image.description"   = "T3 Code web GUI for coding agents on agentbloat"
    "org.opencontainers.image.documentation" = "https://github.com/hambn/tool-containers/tree/main/tools/ai/t3code"
    "io.github.hambn.containers.variant"     = v.variant
    "io.github.hambn.containers.distro"      = v.distro
    "io.github.hambn.containers.tier"        = v.tier
  }
}

group "default" {
  targets = ["t3code"]
}
