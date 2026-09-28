---
name: ai
title: AI
description: Coding-agent CLIs, an agent meta-harness, and a web GUI for agents, packaged on the devbox and agentbloat images with Ubuntu and Alpine variants.
order: 1
---

# AI

Images that package AI coding agents and the tools that drive them. Each builds on the
[`devbox`](../base/devbox/) development image, directly or through
[`agentbloat`](./agentbloat/), and is published to GHCR and Docker Hub under the tags
described in the [catalog](../../README.md#images-and-tags).

- **Source:** [`tools/ai/`](https://github.com/hambn/tool-containers/tree/main/tools/ai)
- **Docs:** [tool-containers.hgh.dev/docs/ai/](https://tool-containers.hgh.dev/docs/ai/)

## Tools

- [agentbloat](./agentbloat/) — Codex, Claude Code, Cursor Agent, Gemini CLI, Copilot, and other coding-agent CLIs in one interactive image.
- [Claude Code](./claude-code/) — Anthropic's Claude Code CLI on devbox.
- [Codex CLI](./codex/) — OpenAI Codex CLI on devbox.
- [Omnigent](./omnigent/) — Omnigent, an open-source AI agent meta-harness, on agentbloat.
- [Open Code Review](./open-code-review/) — Alibaba's Open Code Review AI code review CLI on devbox.
- [Pi Coding Agent](./pi-agent/) — Pi, a minimal and extensible terminal coding agent, on devbox.
- [T3 Code](./t3code/) — T3 Code, a web GUI over coding agents, on agentbloat.
