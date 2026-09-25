# Build graph for every image. Pins live in versions.hcl; always load both files from
# the repository root (contexts are relative to it). ordinary Docker Buildx Bake does:
#   docker buildx bake -f src/tools/docker-bake.hcl -f src/tools/versions.hcl --print all
#
# Published targets are the members of group "all". Targets outside it are internal
# stages that other targets consume through `target:` contexts and are never tagged.

variable "GHCR_NAMESPACE" {
  default = "ghcr.io/hambn"
}

variable "DOCKERHUB_NAMESPACE" {
  default = "docker.io/hambn"
}

# Commit being built. CI sets these from `git log -1`.
variable "GIT_SHA" {
  default = "0000000000000000000000000000000000000000"
}

# Commit date as YYYYMMDD, used in base-image immutable tags.
variable "BUILD_DATE" {
  default = "19700101"
}

# Commit time as RFC 3339 for org.opencontainers.image.created.
variable "CREATED" {
  default = "1970-01-01T00:00:00Z"
}

# Commit time in seconds; BuildKit clamps file and image timestamps to it.
variable "SOURCE_DATE_EPOCH" {
  default = null
}

# Single platform per build, e.g. linux/arm64. Empty builds for the local platform.
variable "PLATFORM" {
  default = ""
}

# Registry cache: set CACHE_REF (e.g. ghcr.io/hambn/buildcache) and ARCH to read,
# plus CACHE_WRITE=true to write.
variable "CACHE_REF" {
  default = ""
}

variable "ARCH" {
  default = "amd64"
}

variable "CACHE_WRITE" {
  default = false
}

# Which tags to emit: all, moving, or immutable. Publishing creates immutable tags
# only when absent and always repoints moving tags.
variable "TAG_SET" {
  default = "all"
}

variable "PRIMARY_AGENT_VARIANT" {
  default = "ubuntu-browser"
}

function "sha7" {
  params = []
  result = substr(GIT_SHA, 0, 7)
}

function "image_tags" {
  params = [repo, immutable, moving]
  result = [
    for pair in setproduct(
      ["${GHCR_NAMESPACE}/${repo}", "${DOCKERHUB_NAMESPACE}/${repo}"],
      TAG_SET == "moving" ? moving : TAG_SET == "immutable" ? immutable : concat(immutable, moving)
    ) : "${pair[0]}:${pair[1]}"
  ]
}

function "base_tags" {
  params = [repo, variant, is_latest]
  result = image_tags(
    repo,
    ["${variant}-${BUILD_DATE}-${sha7()}"],
    is_latest ? [variant, "latest"] : [variant]
  )
}

function "agent_tags" {
  params = [repo, version, variant]
  result = image_tags(
    repo,
    variant == PRIMARY_AGENT_VARIANT ? ["${version}-${variant}", version] : ["${version}-${variant}"],
    variant == PRIMARY_AGENT_VARIANT ? [variant, "latest"] : [variant]
  )
}

function "cache_from" {
  params = [name]
  result = CACHE_REF == "" ? [] : ["type=registry,ref=${CACHE_REF}:${name}-${ARCH}"]
}

function "cache_to" {
  params = [name]
  result = CACHE_REF == "" || !CACHE_WRITE ? [] : ["type=registry,ref=${CACHE_REF}:${name}-${ARCH},mode=max,ignore-error=true"]
}

function "oci_labels" {
  params = [path, title, description, version, tier, variant, distro, base_name]
  result = {
    "org.opencontainers.image.title"         = title
    "org.opencontainers.image.description"   = description
    "org.opencontainers.image.source"        = "https://github.com/hambn/tool-containers"
    "org.opencontainers.image.url"           = "https://tool-containers.hgh.dev"
    "org.opencontainers.image.documentation" = "https://github.com/hambn/tool-containers/tree/main/${path}"
    "org.opencontainers.image.licenses"      = "MIT"
    "org.opencontainers.image.vendor"        = "hambn"
    "org.opencontainers.image.version"       = version
    "org.opencontainers.image.revision"      = GIT_SHA
    "org.opencontainers.image.created"       = CREATED
    "org.opencontainers.image.base.name"     = base_name
    "io.github.hambn.containers.tier"        = tier
    "io.github.hambn.containers.variant"     = variant
    "io.github.hambn.containers.distro"      = distro
  }
}

function "variant_distro" {
  params = [variant]
  result = split("-", variant)[0]
}

function "variant_tier" {
  params = [variant]
  result = length(split("-", variant)) > 1 ? split("-", variant)[1] : "full"
}

# Every agent image starts from a devbox payload and ends with the devbox config layer.
function "agent_contexts" {
  params = [variant]
  result = {
    base            = "target:devbox-payload-${variant_distro(variant)}-${variant_tier(variant)}"
    "devbox-config" = "target:devbox-config"
  }
}

function "agentbloat_contexts" {
  params = [variant]
  result = {
    base            = "target:agentbloat-payload-${variant}"
    "devbox-config" = "target:devbox-config"
  }
}

function "distro_image" {
  params = [distro]
  result = distro == "alpine" ? ALPINE_IMAGE : distro == "ubuntu" ? UBUNTU_IMAGE : WOLFI_IMAGE
}

target "_common" {
  platforms = PLATFORM == "" ? [] : [PLATFORM]
  args = {
    SOURCE_DATE_EPOCH = SOURCE_DATE_EPOCH
    OS_REFRESH        = OS_REFRESH
    ALPINE_IMAGE      = ALPINE_IMAGE
    UBUNTU_IMAGE      = UBUNTU_IMAGE
    WOLFI_IMAGE       = WOLFI_IMAGE
  }
}

target "_agent" {
  inherits   = ["_common"]
  dockerfile = "Dockerfile"
  target     = "image"
}

group "default" {
  targets = ["all"]
}

group "all" {
  targets = ["base", "agents"]
}

group "base" {
  targets = ["core", "devbox"]
}

group "agents" {
  targets = [
    "agentbloat",
    "claude-code",
    "codex",
    "omnigent",
    "open-code-review",
    "pi-agent",
    "t3code",
  ]
}

# --- src/tools/base/core ---------------------------------------------------------

target "core" {
  name       = "core-${distro}"
  matrix     = { distro = ["alpine", "ubuntu", "wolfi"] }
  inherits   = ["_common"]
  context    = "src/tools/base/core"
  dockerfile = "Dockerfile"
  target     = "core"
  args       = { DISTRO = distro }
  tags       = base_tags("core", distro, distro == "wolfi")
  labels = merge(
    oci_labels(
      "src/tools/base/core", "core",
      "Hardened ${distro} application base: CA certificates, tzdata, curl, bash, and a nonroot user",
      "${BUILD_DATE}-${sha7()}", "core", distro, distro,
      split("@", distro_image(distro))[0]
    ),
    { "org.opencontainers.image.base.digest" = split("@", distro_image(distro))[1] }
  )
  cache-from = cache_from("core-${distro}")
  cache-to   = cache_to("core-${distro}")
}

# --- src/tools/base/devbox -------------------------------------------------------

target "_devbox" {
  inherits   = ["_common"]
  context    = "src/tools/base/devbox"
  dockerfile = "Dockerfile"
  args = {
    HEADLESS_SHELL_IMAGE        = HEADLESS_SHELL_IMAGE
    KUBECTL_VERSION             = KUBECTL_VERSION
    HELM_VERSION                = HELM_VERSION
    KUSTOMIZE_VERSION           = KUSTOMIZE_VERSION
    YQ_VERSION                  = YQ_VERSION
    GH_VERSION                  = GH_VERSION
    GLAB_VERSION                = GLAB_VERSION
    TAILSCALE_VERSION           = TAILSCALE_VERSION
    UV_VERSION                  = UV_VERSION
    GO_VERSION                  = GO_VERSION
    NODE_VERSION                = NODE_VERSION
    PNPM_VERSION                = PNPM_VERSION
    YARN_VERSION                = YARN_VERSION
    ZSH_AUTOSUGGESTIONS_VERSION = ZSH_AUTOSUGGESTIONS_VERSION
    OHMYZSH_COMMIT              = OHMYZSH_COMMIT
  }
}

target "devbox" {
  name     = "devbox-${distro}-${tier}"
  matrix   = { distro = ["alpine", "ubuntu"], tier = ["lite", "full", "browser"] }
  inherits = ["_devbox"]
  target   = tier
  args     = { DISTRO = distro }
  contexts = { core = "target:core-${distro}" }
  tags     = base_tags("devbox", "${distro}-${tier}", distro == "ubuntu" && tier == "full")
  labels = merge(
    oci_labels(
      "src/tools/base/devbox", "devbox",
      "Interactive ${distro} development and CI image (${tier} tier)",
      "${BUILD_DATE}-${sha7()}", tier, "${distro}-${tier}", distro,
      "${GHCR_NAMESPACE}/core:${distro}"
    ),
    tier == "lite" ? {} : {
      "io.github.hambn.containers.tool.go.version"      = GO_VERSION
      "io.github.hambn.containers.tool.node.version"    = NODE_VERSION
      "io.github.hambn.containers.tool.uv.version"      = UV_VERSION
      "io.github.hambn.containers.tool.kubectl.version" = KUBECTL_VERSION
      "io.github.hambn.containers.tool.helm.version"    = HELM_VERSION
    }
  )
  cache-from = cache_from("devbox-${distro}-${tier}")
  cache-to   = cache_to("devbox-${distro}-${tier}")
}

# Heavy layers without the config layer; agent images build on these.
target "devbox-payload" {
  name       = "devbox-payload-${distro}-${tier}"
  matrix     = { distro = ["alpine", "ubuntu"], tier = ["full", "browser"] }
  inherits   = ["_devbox"]
  target     = "${tier}-payload"
  args       = { DISTRO = distro }
  contexts   = { core = "target:core-${distro}" }
  cache-from = cache_from("devbox-${distro}-${tier}")
}

# Shell, user, and service configuration shared by devbox and every agent image.
target "devbox-config" {
  inherits   = ["_devbox"]
  target     = "config"
  # Unused by the config stage, but every `FROM ${DISTRO}-…` must still parse.
  args       = { DISTRO = "ubuntu" }
  cache-from = cache_from("devbox-config")
  cache-to   = cache_to("devbox-config")
}

# --- src/tools/ai ----------------------------------------------------------------

target "_agentbloat" {
  inherits = ["_agent"]
  context  = "src/tools/ai/agentbloat"
  args = {
    CLAUDE_CODE_VERSION           = CLAUDE_CODE_VERSION
    CODEX_VERSION                 = CODEX_VERSION
    COPILOT_VERSION               = COPILOT_VERSION
    CURSOR_AGENT_VERSION          = CURSOR_AGENT_VERSION
    GEMINI_VERSION                = GEMINI_VERSION
    GROK_VERSION                  = GROK_VERSION
    OPENCODE_VERSION              = OPENCODE_VERSION
    PI_VERSION                    = PI_VERSION
    ACP_AGENT_VERSION             = ACP_AGENT_VERSION
    AGENT_CLIENT_PROTOCOL_VERSION = AGENT_CLIENT_PROTOCOL_VERSION
  }
}

target "agentbloat" {
  name     = "agentbloat-${variant}"
  matrix   = { variant = ["ubuntu", "alpine", "ubuntu-browser", "alpine-browser"] }
  inherits = ["_agentbloat"]
  args     = { DISTRO = variant_distro(variant) }
  contexts = agent_contexts(variant)
  tags     = base_tags("agentbloat", variant, variant == PRIMARY_AGENT_VARIANT)
  labels = merge(
    oci_labels(
      "src/tools/ai/agentbloat", "agentbloat",
      "Codex, Claude Code, Cursor, Grok, OpenCode, Copilot, Gemini, ACP, and Pi agent CLIs on devbox",
      "${BUILD_DATE}-${sha7()}", "agent", variant, variant_distro(variant),
      "${GHCR_NAMESPACE}/devbox:${variant_distro(variant)}-${variant_tier(variant)}"
    ),
    {
      "io.github.hambn.containers.tool.claude-code.version"  = CLAUDE_CODE_VERSION
      "io.github.hambn.containers.tool.codex.version"        = CODEX_VERSION
      "io.github.hambn.containers.tool.copilot.version"      = COPILOT_VERSION
      "io.github.hambn.containers.tool.cursor-agent.version" = CURSOR_AGENT_VERSION
      "io.github.hambn.containers.tool.gemini.version"       = GEMINI_VERSION
      "io.github.hambn.containers.tool.grok.version"         = GROK_VERSION
      "io.github.hambn.containers.tool.opencode.version"     = OPENCODE_VERSION
      "io.github.hambn.containers.tool.pi.version"           = PI_VERSION
      "io.github.hambn.containers.tool.acp-agent.version"    = ACP_AGENT_VERSION
    }
  )
  cache-from = cache_from("agentbloat-${variant}")
  cache-to   = cache_to("agentbloat-${variant}")
}

# agentbloat without the config layer; omnigent and t3code build on it.
target "agentbloat-payload" {
  name       = "agentbloat-payload-${variant}"
  matrix     = { variant = ["ubuntu", "alpine", "ubuntu-browser", "alpine-browser"] }
  inherits   = ["_agentbloat"]
  target     = "payload"
  args       = { DISTRO = variant_distro(variant) }
  contexts   = agent_contexts(variant)
  cache-from = cache_from("agentbloat-${variant}")
}

target "claude-code" {
  name     = "claude-code-${variant}"
  matrix   = { variant = ["ubuntu", "alpine", "ubuntu-browser", "alpine-browser"] }
  inherits = ["_agent"]
  context  = "src/tools/ai/claude-code"
  args     = { DISTRO = variant_distro(variant), CLAUDE_CODE_VERSION = CLAUDE_CODE_VERSION }
  contexts = agent_contexts(variant)
  tags     = agent_tags("claude-code", CLAUDE_CODE_VERSION, variant)
  labels = merge(
    oci_labels(
      "src/tools/ai/claude-code", "claude-code", "Claude Code CLI on devbox",
      CLAUDE_CODE_VERSION, "agent", variant, variant_distro(variant),
      "${GHCR_NAMESPACE}/devbox:${variant_distro(variant)}-${variant_tier(variant)}"
    ),
    { "io.github.hambn.containers.tool.claude-code.version" = CLAUDE_CODE_VERSION }
  )
  cache-from = cache_from("claude-code-${variant}")
  cache-to   = cache_to("claude-code-${variant}")
}

target "codex" {
  name     = "codex-${variant}"
  matrix   = { variant = ["ubuntu", "alpine", "ubuntu-browser", "alpine-browser"] }
  inherits = ["_agent"]
  context  = "src/tools/ai/codex"
  args     = { DISTRO = variant_distro(variant), CODEX_VERSION = CODEX_VERSION }
  contexts = agent_contexts(variant)
  tags     = agent_tags("codex", CODEX_VERSION, variant)
  labels = merge(
    oci_labels(
      "src/tools/ai/codex", "codex", "OpenAI Codex CLI on devbox",
      CODEX_VERSION, "agent", variant, variant_distro(variant),
      "${GHCR_NAMESPACE}/devbox:${variant_distro(variant)}-${variant_tier(variant)}"
    ),
    { "io.github.hambn.containers.tool.codex.version" = CODEX_VERSION }
  )
  cache-from = cache_from("codex-${variant}")
  cache-to   = cache_to("codex-${variant}")
}

target "pi-agent" {
  name     = "pi-agent-${variant}"
  matrix   = { variant = ["ubuntu", "alpine", "ubuntu-browser", "alpine-browser"] }
  inherits = ["_agent"]
  context  = "src/tools/ai/pi-agent"
  args     = { DISTRO = variant_distro(variant), PI_VERSION = PI_VERSION }
  contexts = agent_contexts(variant)
  tags     = agent_tags("pi-agent", PI_VERSION, variant)
  labels = merge(
    oci_labels(
      "src/tools/ai/pi-agent", "pi-agent", "Pi coding agent on devbox",
      PI_VERSION, "agent", variant, variant_distro(variant),
      "${GHCR_NAMESPACE}/devbox:${variant_distro(variant)}-${variant_tier(variant)}"
    ),
    { "io.github.hambn.containers.tool.pi.version" = PI_VERSION }
  )
  cache-from = cache_from("pi-agent-${variant}")
  cache-to   = cache_to("pi-agent-${variant}")
}

target "open-code-review" {
  name     = "open-code-review-${variant}"
  matrix   = { variant = ["ubuntu", "alpine", "ubuntu-browser", "alpine-browser"] }
  inherits = ["_agent"]
  context  = "src/tools/ai/open-code-review"
  args     = { DISTRO = variant_distro(variant), OPEN_CODE_REVIEW_VERSION = OPEN_CODE_REVIEW_VERSION }
  contexts = agent_contexts(variant)
  tags     = agent_tags("open-code-review", OPEN_CODE_REVIEW_VERSION, variant)
  labels = merge(
    oci_labels(
      "src/tools/ai/open-code-review", "open-code-review", "Alibaba Open Code Review CLI on devbox",
      OPEN_CODE_REVIEW_VERSION, "agent", variant, variant_distro(variant),
      "${GHCR_NAMESPACE}/devbox:${variant_distro(variant)}-${variant_tier(variant)}"
    ),
    { "io.github.hambn.containers.tool.open-code-review.version" = OPEN_CODE_REVIEW_VERSION }
  )
  cache-from = cache_from("open-code-review-${variant}")
  cache-to   = cache_to("open-code-review-${variant}")
}

target "omnigent" {
  name     = "omnigent-${variant}"
  matrix   = { variant = ["ubuntu", "alpine", "ubuntu-browser", "alpine-browser"] }
  inherits = ["_agent"]
  context  = "src/tools/ai/omnigent"
  args     = { DISTRO = variant_distro(variant), OMNIGENT_VERSION = OMNIGENT_VERSION }
  contexts = agentbloat_contexts(variant)
  tags     = agent_tags("omnigent", OMNIGENT_VERSION, variant)
  labels = merge(
    oci_labels(
      "src/tools/ai/omnigent", "omnigent", "Omnigent agent meta-harness on agentbloat",
      OMNIGENT_VERSION, "agent", variant, variant_distro(variant),
      "${GHCR_NAMESPACE}/agentbloat:${variant}"
    ),
    { "io.github.hambn.containers.tool.omnigent.version" = OMNIGENT_VERSION }
  )
  cache-from = cache_from("omnigent-${variant}")
  cache-to   = cache_to("omnigent-${variant}")
}

target "t3code" {
  name     = "t3code-${variant}"
  matrix   = { variant = ["ubuntu", "ubuntu-browser"] }
  inherits = ["_agent"]
  context  = "src/tools/ai/t3code"
  args     = { DISTRO = variant_distro(variant), T3CODE_VERSION = T3CODE_VERSION }
  contexts = agentbloat_contexts(variant)
  tags     = agent_tags("t3code", T3CODE_VERSION, variant)
  labels = merge(
    oci_labels(
      "src/tools/ai/t3code", "t3code", "T3 Code web GUI for coding agents on agentbloat",
      T3CODE_VERSION, "agent", variant, variant_distro(variant),
      "${GHCR_NAMESPACE}/agentbloat:${variant}"
    ),
    { "io.github.hambn.containers.tool.t3code.version" = T3CODE_VERSION }
  )
  cache-from = cache_from("t3code-${variant}")
  cache-to   = cache_to("t3code-${variant}")
}
