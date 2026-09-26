# Tool-specific image contracts

Read this only when a change touches one of these boundaries. Verify each stated path or
pin in the live files before changing it.

## agentbloat

agentbloat bundles several agent CLIs on devbox. It gets no version tag because it
has no single upstream version, and its
published images are the `BASE_IMAGE` of omnigent and t3code, whose workflows run after
`ai/agentbloat` completes on main.

Python tools install with `uv tool` under `/opt/uv-tools` with launchers linked into
`/usr/local/bin`. `AGENT_CLIENT_PROTOCOL_VERSION` is held at a release that still
provides the API `acp-agent` imports; do not release the hold without proving a newer
pair works through the image tests.

## omnigent

Omnigent's uv environment lives in `/opt/uv-tools` with launchers in `/usr/local/bin`,
not under root's home, so `sysadmin` and arbitrary non-root UIDs can run it. Preserve
that or prove equivalent permissions in its tests.

## Limitations

Mark a deliberate, temporary image limitation next to the affected source with a
`# ponytail:` comment stating the constraint and the path to removing it. Do not use the
marker for ordinary commentary or instead of fixing a known issue.
