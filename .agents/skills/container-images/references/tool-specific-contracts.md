# Tool-specific contracts

`runtime` is the shell-capable application foundation. `workspace` core adds neutral Node.js, Go, Python, uv, Git, and Bash; full adds broad tools and styled Zsh. A Zsh asset change must select only the two full workspace profiles.

`codex`, `claude-code`, `open-code-review`, and `pi-agent` derive from Ubuntu core. `agentbloat` packages agents into `/opt/agent-bundle` and has an optional browser profile. `omnigent` and `t3code` derive from neutral Ubuntu core and copy that bundle explicitly; they do not inherit the whole agentbloat image. T3 Code has a browser profile. Test non-root launcher visibility after changing the bundle path or permissions.

The ACP helper currently constrains `agent-client-protocol==0.7.1` because of upstream `ModelInfo` compatibility. Preserve or test a replacement with the ACP launcher. Browser tests must launch the headless browser, not only check binary presence. Any new Alpine agent needs musl runtime verification.
