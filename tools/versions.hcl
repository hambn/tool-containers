# Every pinned input of every image. Renovate updates the values through the
# `# renovate:` comment on the line above each one (see .github/renovate.json5).
# Load together with docker-bake.hcl, from the repository root:
#   .github/scripts/bake.sh --print <target>

# Bump to rebuild every OS package layer without changing any other pin. The weekly
# maintenance workflow opens a PR that sets it to the current date when Trivy finds
# fixable vulnerabilities.
variable "OS_REFRESH" {
  default = "2026-09-25"
}

# --- Base images -------------------------------------------------------------

# renovate: datasource=docker depName=docker.io/library/alpine
variable "ALPINE_IMAGE" {
  default = "docker.io/library/alpine:3.24@sha256:294b683cb724975bec92580e1e685676bd4b50bda910ddb8c51d4cabeaec77e6"
}

# renovate: datasource=docker depName=docker.io/library/ubuntu
variable "UBUNTU_IMAGE" {
  default = "docker.io/library/ubuntu:24.04@sha256:008173c23f95b170204355c12626cb5a965d779a7e1283b09e9cffbb1bf33ca3"
}

# renovate: datasource=docker depName=docker.io/chainguard/wolfi-base
variable "WOLFI_IMAGE" {
  default = "docker.io/chainguard/wolfi-base:latest@sha256:fac38d12efdb4bf43ac9e599a31db10a27ad5dd71e5f1618790962eda8d66180"
}

# renovate: datasource=docker depName=docker.io/chromedp/headless-shell
variable "HEADLESS_SHELL_IMAGE" {
  default = "docker.io/chromedp/headless-shell:151.0.7922.109@sha256:2d349b544a1ea6b5b5fd7c0fe99215ff662339c57407ee2e8c0a11af93516b04"
}

# --- devbox toolchain --------------------------------------------------------

# renovate: datasource=github-releases depName=kubernetes/kubernetes extractVersion=^v(?<version>.+)$
variable "KUBECTL_VERSION" {
  default = "1.37.1"
}

# renovate: datasource=github-releases depName=helm/helm extractVersion=^v(?<version>.+)$
variable "HELM_VERSION" {
  default = "4.3.0"
}

# renovate: datasource=github-releases depName=kubernetes-sigs/kustomize extractVersion=^kustomize/v(?<version>.+)$
variable "KUSTOMIZE_VERSION" {
  default = "5.8.1"
}

# renovate: datasource=github-releases depName=mikefarah/yq extractVersion=^v(?<version>.+)$
variable "YQ_VERSION" {
  default = "4.53.6"
}

# renovate: datasource=github-releases depName=cli/cli extractVersion=^v(?<version>.+)$
variable "GH_VERSION" {
  default = "2.101.0"
}

# renovate: datasource=gitlab-releases depName=gitlab-org/cli extractVersion=^v(?<version>.+)$
variable "GLAB_VERSION" {
  default = "1.119.0"
}

# renovate: datasource=github-releases depName=tailscale/tailscale extractVersion=^v(?<version>.+)$
variable "TAILSCALE_VERSION" {
  default = "1.102.4"
}

# renovate: datasource=github-releases depName=astral-sh/uv
variable "UV_VERSION" {
  default = "0.12.19"
}

# renovate: datasource=golang-version depName=go
variable "GO_VERSION" {
  default = "1.27.1"
}

# renovate: datasource=node-version depName=node versioning=node
variable "NODE_VERSION" {
  default = "24.21.0"
}

# renovate: datasource=npm depName=pnpm
variable "PNPM_VERSION" {
  default = "12.6.0"
}

# renovate: datasource=npm depName=yarn
variable "YARN_VERSION" {
  default = "1.22.22"
}

# renovate: datasource=github-tags depName=zsh-users/zsh-autosuggestions extractVersion=^v(?<version>.+)$
variable "ZSH_AUTOSUGGESTIONS_VERSION" {
  default = "0.7.1"
}

# renovate: datasource=git-refs depName=https://github.com/ohmyzsh/ohmyzsh currentValue=master
variable "OHMYZSH_COMMIT" {
  default = "74965c96098134b192f00084f966b4b02438a739"
}

# --- Agent CLIs --------------------------------------------------------------

# renovate: datasource=npm depName=@anthropic-ai/claude-code
variable "CLAUDE_CODE_VERSION" {
  default = "2.1.282"
}

# renovate: datasource=npm depName=@openai/codex
variable "CODEX_VERSION" {
  default = "0.157.0"
}

# renovate: datasource=npm depName=@earendil-works/pi-coding-agent
variable "PI_VERSION" {
  default = "0.87.1"
}

# renovate: datasource=npm depName=@alibaba-group/open-code-review
variable "OPEN_CODE_REVIEW_VERSION" {
  default = "1.12.9"
}

# renovate: datasource=npm depName=@xai-official/grok
variable "GROK_VERSION" {
  default = "1.0.41"
}

# renovate: datasource=npm depName=opencode-ai
variable "OPENCODE_VERSION" {
  default = "1.18.32"
}

# renovate: datasource=npm depName=@github/copilot
variable "COPILOT_VERSION" {
  default = "1.0.88"
}

# renovate: datasource=npm depName=@google/gemini-cli
variable "GEMINI_VERSION" {
  default = "0.61.0"
}

# renovate: datasource=custom.cursor-agent depName=cursor-agent
variable "CURSOR_AGENT_VERSION" {
  default = "2026.09.23-86fc751"
}

# renovate: datasource=pypi depName=acp-agent
variable "ACP_AGENT_VERSION" {
  default = "0.2.4"
}

# Held: newer releases conflict with the distro Python packages acp-agent runs beside.
# renovate: datasource=pypi depName=agent-client-protocol
variable "AGENT_CLIENT_PROTOCOL_VERSION" {
  default = "0.7.1"
}

# renovate: datasource=pypi depName=omnigent
variable "OMNIGENT_VERSION" {
  default = "0.15.0"
}

# renovate: datasource=npm depName=t3
variable "T3CODE_VERSION" {
  default = "0.0.42"
}
