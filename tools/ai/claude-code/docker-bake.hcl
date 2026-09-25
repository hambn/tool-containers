# Variants of claude-code. Run from this directory:
#   docker buildx bake                    # build every variant
#   docker buildx bake claude-code-ubuntu   # build one variant
#   docker buildx bake --print            # show what would be built
# CI builds one variant per job from this file and pins BASE_IMAGE to a digest; see
# .github/workflows/_image.yml.

target "claude-code" {
  name    = "claude-code-${v.variant}"
  matrix  = {
    v = [
      { variant = "ubuntu", distro = "ubuntu", tier = "agent", base = "ghcr.io/hambn/devbox:ubuntu-full" },
      { variant = "alpine", distro = "alpine", tier = "agent", base = "ghcr.io/hambn/devbox:alpine-full" },
      { variant = "ubuntu-browser", distro = "ubuntu", tier = "agent", base = "ghcr.io/hambn/devbox:ubuntu-browser" },
      { variant = "alpine-browser", distro = "alpine", tier = "agent", base = "ghcr.io/hambn/devbox:alpine-browser" },
    ]
  }
  context = "."
  tags    = ["tool-containers/claude-code:${v.variant}"]
  args = {
    BASE_IMAGE = v.base
  }
  labels = {
    "org.opencontainers.image.title"         = "claude-code"
    "org.opencontainers.image.description"   = "Claude Code CLI on devbox"
    "org.opencontainers.image.documentation" = "https://github.com/hambn/tool-containers/tree/main/tools/ai/claude-code"
    "io.github.hambn.containers.variant"     = v.variant
    "io.github.hambn.containers.distro"      = v.distro
    "io.github.hambn.containers.tier"        = v.tier
  }
}

group "default" {
  targets = ["claude-code"]
}
