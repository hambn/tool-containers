# tool-containers

Docker images for many purposes — AI agents, CI builders, sandboxes, and more. Each image is a self-contained "tool" inside a category, with multiple build variants, per-platform deployment recipes, and its own CI pushing to GHCR and Docker Hub (Quay pending).

Repository and agent guidance lives in [`.agents/`](./.agents/README.md).

## Catalog

### ai

| Tool | Description |
|-------|-------------|
| [codex](./ai/codex/) | [OpenAI Codex CLI](https://github.com/openai/codex) on agentimg foundations |
| [agentbloat](./ai/agentbloat/) | Current Codex, Claude, Cursor, Grok, OpenCode, Copilot, Gemini, ACP Registry, and Pi agent CLIs on agentimg foundations |
| [open-code-review](./ai/open-code-review/) | Alibaba Open Code Review CLI on agentimg foundations |
| [claude-code](./ai/claude-code/) | [Claude Code](https://github.com/anthropics/claude-code) CLI in a container |
| [t3code](./ai/t3code/) | [T3 Code](https://github.com/pingdotgg/t3code) web GUI for coding agents in a container |

### base

| Tool | Description |
|------|-------------|
| [agentimg](./base/agentimg/) | Broad Ubuntu and Alpine foundation images with optional headless Chromium |

### ci

_None yet._

### sandboxes

_None yet._
