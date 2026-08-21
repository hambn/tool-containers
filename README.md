# tool-containers

Docker images for many purposes — AI agents, CI builders, sandboxes, and more. Each image is a self-contained "tool" inside a category, with multiple build variants, per-platform deployment recipes, and its own CI pushing to GHCR and Docker Hub (Quay pending).

Repository guidance starts in [`AGENTS.md`](./AGENTS.md) and is implemented as
on-demand [repository skills](./.agents/skills/).

## Catalog

### ai

| Tool | Description |
|-------|-------------|
| [codex](./images/ai/codex/) | [OpenAI Codex CLI](https://github.com/openai/codex) on agentimg foundations |
| [agentbloat](./images/ai/agentbloat/) | Current Codex, Claude, Cursor, Grok, OpenCode, Copilot, Gemini, ACP Registry, and Pi agent CLIs on agentimg foundations |
| [open-code-review](./images/ai/open-code-review/) | Alibaba Open Code Review CLI on agentimg foundations |
| [pi-agent](./images/ai/pi-agent/) | [Pi](https://github.com/earendil-works/pi) coding agent on agentimg foundations |
| [omnigent](./images/ai/omnigent/) | [Omnigent](https://github.com/omnigent-ai/omnigent) AI agent meta-harness on agentbloat foundations |
| [claude-code](./images/ai/claude-code/) | [Claude Code](https://github.com/anthropics/claude-code) CLI in a container |
| [t3code](./images/ai/t3code/) | [T3 Code](https://github.com/pingdotgg/t3code) web GUI for coding agents in a container |

### base

| Tool | Description |
|------|-------------|
| [agentimg](./images/base/agentimg/) | Broad Ubuntu and Alpine foundation images with optional headless Chromium |

### ci

_None yet._

### sandboxes

_None yet._
