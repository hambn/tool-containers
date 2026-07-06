# tool-containers

Docker images for many purposes — AI agents, CI builders, sandboxes, and more. Each image is a self-contained "tool" inside a category, with multiple build variants, per-platform deployment recipes, and its own CI pushing to GHCR and Docker Hub (Quay pending).

Repo conventions live in [`.structure/`](./.structure/structure.md).

## Catalog

### ai

| Tool | Description |
|-------|-------------|
| [claude-code](./ai/claude-code/) | [Claude Code](https://github.com/anthropics/claude-code) CLI in a container |
| [t3code](./ai/t3code/) | [T3 Code](https://github.com/pingdotgg/t3code) web GUI for coding agents in a container |

### ci

_None yet._

### sandboxes

_None yet._
