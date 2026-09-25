# tool-containers

Container images for application bases, interactive workspaces, and ready-to-use coding agents. A shared catalog and release workflow publish tested profiles to GHCR and Docker Hub.

Repository guidance starts in [`AGENTS.md`](./AGENTS.md) and is implemented as
on-demand [repository skills](./.agents/skills/).

The [image migration guide](./.github/image-migration.md) maps retired tags to the new catalog. Existing old tags remain in registries but no longer receive updates.

## Catalog

### ai

| Tool | Description |
|-------|-------------|
| [codex](./tools/ai/codex/) | [OpenAI Codex CLI](https://github.com/openai/codex) on a neutral workspace |
| [agentbloat](./tools/ai/agentbloat/) | Codex, Claude, Cursor, Grok, OpenCode, Copilot, Gemini, ACP, and Pi agent CLIs |
| [open-code-review](./tools/ai/open-code-review/) | Alibaba Open Code Review CLI |
| [pi-agent](./tools/ai/pi-agent/) | [Pi](https://github.com/earendil-works/pi) coding agent |
| [omnigent](./tools/ai/omnigent/) | [Omnigent](https://github.com/omnigent-ai/omnigent) with an explicit agent bundle |
| [claude-code](./tools/ai/claude-code/) | [Claude Code](https://github.com/anthropics/claude-code) CLI in a container |
| [t3code](./tools/ai/t3code/) | [T3 Code](https://github.com/pingdotgg/t3code) web GUI for coding agents in a container |

### base

| Tool | Description |
|------|-------------|
| [runtime](./tools/base/runtime/) | Small shell-capable Alpine and Ubuntu application bases |

### dev

| Tool | Description |
|------|-------------|
| [workspace](./tools/dev/workspace/) | Core and full Alpine and Ubuntu interactive environments |

### ci

_None yet._

### sandboxes

_None yet._
