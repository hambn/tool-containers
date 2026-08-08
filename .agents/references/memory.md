# Project memory

Read this file when repository history or prior decisions can affect a task, and before
making repository changes. Update it in the same change as every repository modification.

Keep it curated and concise. Store durable facts, decisions, constraints, and proven
validation only. Never store secrets, personal data, raw transcripts, transient logs, or
unverified assumptions.

## Stable project facts

- This repository is a monorepo of containerized tools organized as `category/tool`.
- Each tool owns a `README.md`, one Dockerfile per image variant under `images/`, and
  platform-specific runnable examples under `deployment/`.
- Current catalog entries include `ai/claude-code`, `ai/t3code`, `ai/codex`,
  `ai/open-code-review`, `ai/pi-agent`, `ai/agentbloat`, `ai/omnigent`, and
  `base/agentimg`.
- `ai/codex` publishes four Codex CLI profiles directly on the matching `agentimg`
  tags, with `ubuntu-browser` as primary.
- `ai/open-code-review` publishes four OCR profiles on the matching `agentimg` tags;
  its primary moving tag also owns `ocr-v<version>` when the OCR package changes.
- Each current tool has a dedicated `.github/workflows/<category>-<tool>.yml` workflow
  using plan, build-by-digest, and registry fan-out push stages.
- Current image publishing targets GHCR and Docker Hub. Quay is documented as a future
  target but is not wired into the workflows.
- Current workflows build `linux/amd64`; adding arm64 requires native runner validation,
  not blind QEMU expansion.
- `.agents/` is the canonical, version-controlled home for agent guidance. Root
  `AGENTS.md` and `CLAUDE.md` are pointers to `.agents/README.md`.

## Durable decisions

- Repository and tool authoring guidance lives under `.agents/references/`; `.structure/`
  is no longer the canonical location.
- `.agents/README.md` is a concise router. Detailed structure, image, deployment, CI,
  registry, and README rules remain on demand.
- Repository-changing tasks update this file and pass
  `bash .agents/commands/check-agent-workspace.sh` plus `git diff --check`.
- Every path under `.agents/` appears exactly once in the annotated workspace list in
  `.agents/README.md`; the checker enforces that invariant.
- Add agents, prompts, rules, and skills only when a concrete reusable need exists.
  Empty extension directories are retained with `.gitkeep` files until then.
- Deployment examples use `/workspace` as the standard working-directory mount and keep
  runtime secrets outside the repository.
- `.gitignore` excludes local agent runtime/configuration (`.claude/`, `.codex/`, and
  `.mcp.json`) while keeping the canonical `.agents/` workspace and root pointers tracked.
- Reusable foundation images belong in the top-level `base/` category; user-facing tools
  remain in their purpose-specific categories.
- `base/agentimg` publishes four variants: `ubuntu-browser` (primary), `ubuntu`,
  `alpine-browser`, and `alpine`. It contains no AI agents, Exe-specific components,
  Ghostty customization, nginx, or other web servers.
- Agentimg source pushes tag only changed variants as `<variant>-<12-char-commit-sha>`
  alongside their moving variant tags. Scheduled base-image refreshes update only moving
  tags and therefore do not create unbounded immutable tags.
- Codex source edits and `agentimg` base refreshes repoint moving tags only; a detected
  `@openai/codex` release also publishes `codex-v<version>` on the primary image.
- Pi source edits and `agentimg` base refreshes repoint moving tags only; a detected
  `@earendil-works/pi-coding-agent` release also publishes `pi-v<version>` on the primary
  image.

## Change records

### 2026-07-29 — Consolidate repository guidance under `.agents`

- Scope: created the `.agents` workspace, moved and rewrote the legacy repository/tool
  structure guides under `.agents/references/`, and added root entry-point pointers.
- Decisions: use progressive disclosure, keep the workspace self-describing, require a
  memory update for repository changes, and verify path coverage with a shell checker.
- Validation: `bash .agents/commands/check-agent-workspace.sh`, `bash -n
  .agents/commands/check-agent-workspace.sh`, `git diff --check`, and the relative
  Markdown-link check all passed; `.agents/README.md` is 97 lines.

### 2026-07-29 — Ignore local agent runtime state

- Scope: expanded `.gitignore` for `.codex/` and `.mcp.json`, alongside the existing
  `.claude/` rule.
- Decision: keep repository guidance version-controlled; ignore only local agent runtime
  and MCP configuration that should not be committed.
- Validation: verify each local path with `git check-ignore` and rerun the workspace and
  whitespace checks.

### 2026-07-29 — Add the base image category

- Scope: added the `base/` category and reserved `base/agentimg/` as its first
  image-project path.
- Decision: use `base/` for generally reusable foundation images shared by AI,
  sandbox, CI, and other purpose-specific images.
- Validation: compare the catalog with the top-level category tree, run the agent
  workspace checker, and run the whitespace check.

### 2026-07-29 — Implement agentimg foundation images

- Scope: added four Ubuntu/Alpine browser/no-browser images, operational documentation,
  deployment examples, and a build-by-digest workflow publishing to GHCR and Docker Hub.
- Decisions: preserve Exeuntu's general developer tool and service capabilities while
  excluding its AI/Exe/web layers; use source-change commit tags and stable-only scheduled
  refreshes.
- Validation: completed Docker builds and runtime smoke tests for `ubuntu` and `alpine`;
  confirmed Alpine 3.21 Chromium package resolution and executable path; parsed shell and
  YAML files; linted/rendered Helm; checked local links and the file map; ran the agent
  workspace checker and whitespace check. The full Alpine browser build was canceled
  after package resolution when its long-running install stopped producing output.

### 2026-07-29 — Add GitLab CLI to agentimg

- Scope: installed the checksum-verified GitLab CLI release binary in all four agentimg
  variants and documented it in the shared tool inventory.
- Decision: pin the current upstream release through `GLAB_VERSION` and use GitLab's
  release archive for consistent versions across Ubuntu and Alpine.
- Validation: verified the official archive checksum and asset layout, then extracted and
  ran `glab version` successfully in clean Ubuntu 24.04 and Alpine 3.21 containers. The
  full Alpine build was canceled after an existing 400-package layer encountered a
  transient host I/O error; `git diff --check` passed, while the workspace checker could
  not detect this ignored memory file.

### 2026-07-29 — Add agentbloat multi-agent images

- Scope: added four `ai/agentbloat` variants derived from the matching `base/agentimg`
  tags, packaging Codex, Claude Code, Cursor Agent, Grok, OpenCode, GitHub Copilot,
  Gemini, Pi, and the `acp-agent` ACP Registry helper; added deployment examples,
  catalog/readme documentation, and an hourly update workflow.
- Decisions: source edits and agentimg base refreshes publish moving tags only; scheduled
  agent-package changes publish moving tags plus one version tag per changed CLI on the
  primary `ubuntu-browser` image. Agent version labels and base digests drive detection.
- Validation: all four Dockerfiles passed `docker buildx build --check`; workflow and
  deployment shell snippets passed `bash -n`; seven regular YAML files parsed; Compose
  config and Helm lint/template passed. A real Alpine build pulled the published base
  and reached npm installation, then was canceled after several minutes without output.

### 2026-07-29 — Fix pinned Cursor Agent installation

- Scope: corrected all four agentbloat Dockerfiles so CI's resolved Cursor release archive
  uses its extracted `cursor-agent` binary instead of looking for the latest-installer
  symlink, which exists only in the unpinned branch.
- Validation: `git diff --check` passed; Dockerfile checks were retried but GHCR metadata
  resolution intermittently timed out after the correction.

### 2026-07-29 — Isolate ACP Agent CLI dependencies

- Scope: replaced system `pip` installation of `acp-agent` with an isolated `uv tool`
  environment linked into `/usr/local/bin` in all four agentbloat variants.
- Decision: avoid uninstalling Debian-owned Python packages such as `typing_extensions`,
  whose missing pip RECORD metadata breaks `pip install --break-system-packages`.
- Compatibility: constrain `agent-client-protocol` to `0.7.1` because the current
  `acp-agent` release imports `ModelInfo`, which is absent from the latest protocol SDK.

### 2026-07-29 — Rebase t3code on agentbloat

- Scope: replaced the old Node-only t3code profiles with `ubuntu-browser`, `ubuntu`,
  `alpine-browser`, and `alpine` images based on the matching moving `agentbloat` tags;
  updated deployment examples and removed the obsolete separate DinD image.
- Decisions: base digest refreshes and t3code source edits repoint moving variant tags
  only. Inherited agent-label or T3 release changes also publish the primary image tag
  `t3code-stable-v<version>` or `t3code-nightly-v<version>`; all profiles still receive
  their moving variant tags. The workflow checks agentbloat completion events as well as
  its hourly schedule so base refreshes are picked up promptly.
- Validation: workflow YAML and all embedded shell blocks parsed with PyYAML and
  `bash -n`; t3code relative links and the four-variant file map passed; Docker
  build checks were attempted but the local Docker socket denied access. The
  workspace checker could not observe this ignored memory file in the repository's
  Git index; `git diff --check` passed.

### 2026-07-29 — Keep transient t3code Trivy failures non-blocking

- Scope: made the t3code Trivy report step continue after scanner infrastructure
  failures such as a GHCR HTTP/2 layer-stream reset.
- Decision: the scan remains enabled and visible in logs, but it is informational
  because its configured vulnerability exit code is already `0`; digest artifact
  creation and registry publication must not be skipped by a remote layer-read error.

### 2026-07-30 — Add Alibaba Open Code Review images

- Scope: added four `ai/open-code-review` images based on the matching `agentimg`
  profiles, with the `@alibaba-group/open-code-review` package and `ocr` entrypoint.
- Decision: source edits and agentimg base-only refreshes update moving tags only; an OCR
  package update also publishes the primary `ocr-v<version>` tag.
- Validation: workflow YAML and embedded shell blocks parsed; Dockerfile `buildx --check`
  passed for all four variants; Compose config, relative Markdown links, shell syntax,
  and whitespace checks passed. The workspace checker cannot detect this ignored memory
  file in the repository's Git index.

### 2026-07-30 — Add OpenAI Codex images

- Scope: added four `ai/codex` profiles based directly on the matching `agentimg`
  variants, with Docker, Compose, and Podman recipes, catalog documentation, and an
  hourly/base-refresh-aware workflow publishing to GHCR and Docker Hub.
- Decisions: moving variant tags and primary `latest` update for source, Codex package,
  or `agentimg` changes; only a detected Codex package release adds primary
  `codex-v<version>`.
- Validation: shell scripts, workflow/Compose YAML, embedded workflow planning shell,
  file-map assertions, and whitespace checks passed. Dockerfile `buildx --check` was
  blocked by denied access to the local Docker socket; the workspace checker could not
  observe this ignored memory file in the repository's Git index.

### 2026-07-30 — Rebuild Claude Code on agentimg

- Scope: replaced the legacy Node/Alpine-specific Claude Code profiles with exactly
  `ubuntu-browser`, `ubuntu`, `alpine-browser`, and `alpine` images derived from the
  four `base/agentimg` tags; removed the obsolete profile names and updated only the
  Claude Code CI workflow.
- Decision: source edits and `agentimg` base refreshes repoint moving tags only. A
  scheduled Claude Code package update repoints all moving tags and adds `cc-v<version>`
  to the primary `ubuntu-browser` image. Successful `base/agentimg` workflow completions
  trigger the base-drift check immediately.
- Validation: workflow YAML and embedded shell blocks parsed successfully; Compose
  config and Helm lint/template passed; all four Dockerfiles passed
  `docker buildx build --check`; `git diff --check` passed. The workspace checker
  cannot detect this ignored memory file in the repository's Git index.

### 2026-07-30 — Add Pi agent images

- Scope: added four `ai/pi-agent` profiles based on the matching `agentimg` variants,
  packaging `@earendil-works/pi-coding-agent` with Docker, Compose, and Podman recipes,
  catalog documentation, and a scheduled/base-refresh-aware workflow.
- Decision: source edits and `agentimg` base-only refreshes repoint moving tags only. A
  scheduled Pi package update repoints all moving tags and adds `pi-v<version>` to the
  primary `ubuntu-browser` image.
- Validation: the 2026-08-08 repository-hardening pass later covered workflow YAML and
  embedded shell, Dockerfile contracts, deployment rendering, executable bits, workspace
  integrity, and whitespace without building or pulling an image locally.

### 2026-08-05 — Add Omnigent images

- Scope: added four `ai/omnigent` profiles based on the matching moving `agentbloat`
  tags, installing the Omnigent Python CLI with uv, plus Docker, Compose, and Podman
  recipes, catalog documentation, and an automated workflow.
- Decision: source edits and `agentbloat` base refreshes repoint moving tags only. A
  detected Omnigent PyPI release repoints all moving tags and adds `omnigent-v<version>`
  to the primary `ubuntu-browser` image. Successful `ai/agentbloat` completions trigger
  the base-drift check immediately as well as the hourly schedule.
- Validation: workflow YAML and embedded shell blocks parsed; Compose config, deployment
  shell syntax, Dockerfile base/entrypoint contracts, executable bits, and file-map
  references passed; all four `docker buildx build --check` runs completed with no
  warnings; `git diff --check` passed. The workspace checker could not observe this
  ignored memory file in the repository's Git index.

### 2026-08-07 — Make Omnigent launchers available to non-root users

- Scope: moved all four Omnigent uv tool environments from root's private home to
  `/opt/uv-tools` while retaining launcher symlinks in `/usr/local/bin`.
- Decision: derived images may install tools as root during build, but runtime launchers
  must resolve and execute for the inherited `agent` user and explicit non-root UIDs.
- Validation: all four `docker buildx build --check` runs passed and `git diff --check`
  passed. A local UID `1000` smoke build was deferred because none of the 1.4–1.9 GB
  agentbloat bases were cached; the pushed GitHub Actions matrix and post-publish
  Kubernetes rollout provide the real build and runtime checks. The workspace checker
  cannot observe this ignored memory file in the repository's Git index.

### 2026-08-08 — Harden repository publication and runtime contracts

- Scope: made `.agents/` and its root pointers version-controlled, corrected stale tool
  and deployment documentation, and parameterized derived and foundation Dockerfile bases
  for digest-pinned CI input. Derived images now return to the non-root `agent` user;
  ACP/OCR launchers, rootless Podman mappings, required absolute Compose workspaces,
  air-gapped arguments, local T3 bindings, and Kubernetes/Helm/Swarm security defaults
  were repaired or tightened.
- CI decisions: serialize each publisher without canceling in-flight releases, restrict
  manual publication to `main`, resolve base inputs to digests, fail closed on diff,
  registry-inspection, immutable-tag, and HIGH/CRITICAL vulnerability checks, and rebuild
  every foundation variant weekly to capture package-repository updates. Third-party
  actions are pinned to full commit SHAs and monitored by Dependabot. Shared static
  validation runs on pull requests and never builds, pulls, or runs an image.
- Documentation decisions: keep one tracked canonical agent workspace, document the four
  actual variants and tag policies, require callers to set an absolute `WORKSPACE`, and
  remove unsupported published-chart claims and stale links.
- Validation: `.github/scripts/validate-repository.sh`, workflow YAML and embedded shell
  parsing, deployment shell syntax, all Compose renders, all Helm lint/template checks,
  all Swarm renders, `bash .agents/commands/check-agent-workspace.sh`, and
  `git diff --check`. No local image build, pull, or runtime execution was performed per
  the task constraint.
