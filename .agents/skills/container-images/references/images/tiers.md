# Image tiers

Every published image belongs to one tier. Each tier builds on the one below through
bake `contexts`, so a child always gets the parent built from the same commit.

| Tier | Project | Parent | Published variants | Contract |
|---|---|---|---|---|
| core | `tools/base/core` | distro base image | `alpine`, `ubuntu`, `wolfi` | hardened application base |
| devbox | `tools/base/devbox` | core of the same distro | `<distro>-{lite,full,browser}` for alpine, ubuntu | interactive development and CI |
| agent | `tools/ai/<tool>` | devbox or agentbloat payload | `ubuntu`, `alpine`, `ubuntu-browser`, `alpine-browser` | one agent CLI or service |

## core

Distro base plus ca-certificates, tzdata, curl, and bash; user and group `nonroot`
(65532:65532, home `/home/nonroot`); no sudo; setuid/setgid bits stripped; docs, man
pages, and caches removed; the package manager stays. Ubuntu drops its stock `ubuntu`
user. The published stage `core` ends `USER 65532:65532`, `WORKDIR /home/nonroot`,
`CMD ["bash"]`. `wolfi` is core-only.

## devbox

Starts from the named context `core` (whose user is nonroot, so stages begin with
`USER root`).

- **lite:** zsh with pinned plugins and oh-my-zsh pieces, git, openssh-client, sudo,
  neovim, tmux, jq, ripgrep, fd, fzf, less; user `sysadmin` (1000:1000, `/bin/zsh`,
  NOPASSWD sudo).
- **full:** lite plus Python/uv/pipx, Node/pnpm/yarn, Go, build toolchain, Docker CLI with
  buildx and compose, kubectl/helm/kustomize/yq, gh/glab, tailscale, network and debug
  tools, and systemd on ubuntu. Creates `/workspace` owned by 1000:1000.
- **browser:** full plus headless Chromium (ubuntu copies `HEADLESS_SHELL_IMAGE`; alpine
  installs the chromium package); `BROWSER_BIN` points at it.

Stages: `<tier>-payload` holds the heavy layers and every `ENV`; `config` (from scratch)
holds the distro-independent `rootfs/` dotfiles and service config; the published `<tier>`
stage is the payload plus `COPY --link --from=config / /`, `USER sysadmin`,
`WORKDIR /home/sysadmin`, and a login-zsh `CMD`.

## agents

Agent Dockerfiles start from the named context `base`: the devbox payload of the
matching distro and tier (`ubuntu` → `devbox-payload-ubuntu-full`, `alpine-browser` →
`devbox-payload-alpine-browser`), or for omnigent and t3code the agentbloat payload of
the same variant. They add only their tool, then the published stage `image` appends
`devbox-config` last, so a config change rebuilds only that thin layer everywhere.

Agents inherit Node, Python, and shell tooling from devbox; never reinstall a runtime
merely to package a CLI. The runtime user is `sysadmin` and the work directory
`/workspace`.

## Choosing where something belongs

- Needed by every agent or interactive user → devbox `full` (or `lite` if tiny and
  shell-related).
- Needed by one tool → that tool's Dockerfile.
- Needed by a non-interactive application image → build on core.
- Verify musl compatibility before adding a native dependency to an alpine variant.
