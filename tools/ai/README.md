---
name: ai
title: AI
description: Coding-agent CLIs, an agent meta-harness, and a web GUI for agents, built on the devbox and agentbloat images for Ubuntu and, mostly, Alpine.
order: 1
---

# AI

Images for AI coding agents and the tools that drive them. The single-agent images
build on [devbox](../base/devbox/); Omnigent and T3 Code build on
[agentbloat](./agentbloat/), which adds eight agent CLIs to devbox. Every image is
published to GHCR and Docker Hub with the tags described in the
[catalog](../../README.md#images-and-tags).

- **Source:** [`tools/ai/`](https://github.com/hambn/tool-containers/tree/main/tools/ai)
- **Docs:** [tool-containers.hgh.dev/docs/ai/](https://tool-containers.hgh.dev/docs/ai/)

## Tools

- [agentbloat](./agentbloat/) — Codex, Claude Code, Cursor Agent, Grok, OpenCode, Copilot, Gemini CLI, and Pi in one interactive image.
- [Claude Code](./claude-code/) — Anthropic's Claude Code CLI on devbox.
- [Codex CLI](./codex/) — OpenAI's Codex CLI on devbox.
- [Omnigent](./omnigent/) — The Omnigent agent meta-harness on agentbloat, so it can drive any of the bundled agents.
- [Open Code Review](./open-code-review/) — Alibaba's Open Code Review CLI, ocr, on devbox.
- [Pi Coding Agent](./pi-agent/) — Pi, a small, extensible terminal coding agent, on devbox.
- [T3 Code](./t3code/) — The T3 Code web GUI for coding agents on agentbloat, served on port 3773.
