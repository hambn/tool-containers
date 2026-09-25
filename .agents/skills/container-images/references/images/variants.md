# Image profiles

Profiles state compatibility and contents. The launch catalog is curated:

| Product | Moving tags | Contract |
|---|---|---|
| `runtime` | `alpine-3.21-minimal`, `ubuntu-24.04-minimal` | POSIX shell, curl, CA certificates, UID/GID 1000 |
| `workspace` | `alpine-3.21-core`, `ubuntu-24.04-core` | Neutral development runtimes without shell decoration |
| `workspace` | `alpine-3.21-full`, `ubuntu-24.04-full` | Broad tools and styled Zsh |
| Agent products | `ubuntu-24.04` | Tested ready-to-use agent on neutral core |
| `agentbloat`, `t3code` | `ubuntu-24.04-browser` | Product plus tested headless browser |

Do not generate every distribution, size, browser, and tool combination. Add a profile when a consumer needs it and the runtime smoke test passes. Alpine agent profiles require native package and musl tests. Browser profiles depend on the standard product profile and add the browser late. The catalog owns tags and dependencies. No `latest` tag is published.
