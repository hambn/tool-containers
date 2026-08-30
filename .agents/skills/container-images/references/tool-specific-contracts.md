# Tool-specific image contracts

Read this reference only when a change touches one of these inheritance or compatibility
boundaries. Verify every stated version or path in the live Dockerfile/workflow before
changing it.

## Shared variant graph

Every current project publishes `ubuntu-browser` as primary, plus `ubuntu`,
`alpine-browser`, and `alpine`:

- `agentimg` is the foundation.
- `agentbloat`, `claude-code`, `codex`, `open-code-review`, and `pi-agent` derive from the
  matching `agentimg` variant.
- `omnigent` and `t3code` derive from the matching `agentbloat` variant.

Keep variant-to-variant inheritance aligned. A parent workflow completion is an update
signal for each direct child workflow.

## Agentimg runtime

- The four flat Dockerfiles share distro-specific setup scripts and common Zsh assets.
- They create the UID/GID-1000 `sysadmin` runtime user, default to
  `WORKDIR /home/sysadmin`, and provide the shared Node.js and developer-tool runtime
  used downstream. Platform examples mount user work at `/workspace`; derived tool
  images set that as their work directory.
- Browser profiles may use a separate global `BROWSER_BASE`; all profiles accept global
  `RUNTIME_BASE`. The workflow resolves those bases to digests.
- Derived images do not reinstall Node merely to package a Node CLI. They accept a global
  `BASE_IMAGE`, elevate only for build-time installation, and restore `USER sysadmin`
  before the final runtime contract.

## AgentBloat ACP compatibility

AgentBloat installs Python tools with `uv tool` under `/opt/uv-tools` and links launchers
through `/usr/local/bin`. Its current `acp-agent` installation constrains
`agent-client-protocol==0.7.1` because that release imports `ModelInfo`, which newer
protocol SDKs removed. Do not remove or change the pin without building and running the
ACP helper against the proposed compatible versions.

## Omnigent non-root launchers

Omnigent installs its uv environment in `/opt/uv-tools` with launchers in
`/usr/local/bin`, not under root's home. The inherited `sysadmin` user and arbitrary
explicit non-root UIDs must be able to resolve and execute the launcher. Preserve that
location or prove equivalent permissions with a non-root smoke test.

## Limitations

Mark a deliberate, temporary image limitation near the affected source with a
`# ponytail:` comment that explains the constraint and upgrade path. Do not use the tag
for ordinary commentary or as a substitute for fixing a known issue.
