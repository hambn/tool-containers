# Image tag migration

The new catalog publishes explicit distribution, release, and capability tags. Existing `latest`, `ubuntu`, `alpine`, `ubuntu-browser`, and `alpine-browser` tags stop moving when the shared publisher replaces the old workflows. No compatibility aliases are published. Existing registry artifacts are not deleted.

| Old pull | New pull |
|---|---|
| `agentimg:alpine` or `agentimg:ubuntu` | Choose `runtime:<distro>-<release>-minimal` for an app base, or `workspace:<distro>-<release>-core` for development tools. |
| `agentimg:alpine-browser` or `agentimg:ubuntu-browser` | Use `workspace:<distro>-<release>-full` for a broad interactive shell. The new workspace has no browser profile. |
| `<agent>:latest` or `<agent>:ubuntu` | `<agent>:ubuntu-24.04` for Codex, Claude Code, Open Code Review, Pi, AgentBloat, and Omnigent. |
| `agentbloat:ubuntu-browser` | `agentbloat:ubuntu-24.04-browser`. |
| `t3code:latest` or `t3code:ubuntu-browser` | `t3code:ubuntu-24.04-browser`. |
| Any agent `:alpine` or `:alpine-browser` | No Alpine agent profile is published in the initial catalog. Use its Ubuntu profile until an Alpine runtime passes compatibility tests. |
| Browser-enabled Codex, Claude, Pi, OCR, or Omnigent | Use `agentbloat:ubuntu-24.04-browser` when its bundled agents fit the use case. |

Use the full registry path, such as `ghcr.io/hambn/codex:ubuntu-24.04` or `docker.io/hambn/codex:ubuntu-24.04`. A moving tag gets tested automatic updates, including major agent releases. Pin `@sha256:<digest>` when a deployment must keep one exact image. Every successful build also publishes a unique `<profile>-b<run-id>-<attempt>` tag.

The [pre-migration manifest measurements](./image-baseline.md) record the old layer overlap and workflow duration. The [catalog](../README.md) links each product's supported profiles and examples.
