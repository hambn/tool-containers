# Registries and tags

## Registries

| Registry | Image path | Authentication |
|----------|------------|----------------|
| GHCR | `ghcr.io/<owner>/<tool>` | built-in `GITHUB_TOKEN` |
| Docker Hub | `docker.io/<owner>/<tool>` | `DOCKERHUB_USERNAME` / `DOCKERHUB_TOKEN` |
| Quay.io | `quay.io/<owner>/<tool>` | `QUAY_USERNAME` / `QUAY_TOKEN` when enabled |

Current workflows build and push to GHCR by digest, then copy those exact digests to
Docker Hub. Quay is a documented candidate only; add it to a workflow matrix, login step,
and target mapping together when it becomes an actual publishing target.

## Tag scheme

All current image workflows publish moving convenience tags. The primary variant also
owns `latest`; every variant owns its matching `<variant>` tag.

| Tag | Ownership | Meaning |
|-----|-----------|---------|
| `latest` | primary variant only | newest primary build |
| `<variant>` | every variant | newest build of that variant |
| `<tool>-v<version>` (or the tool-specific form below) | primary variant only | immutable upstream release reference |
| `<variant>-<12-char-commit-sha>` | `base/agentimg`, changed variants on source pushes | immutable source-build reference |

Derived tools do not currently publish a universal
`<variant>-<version>-<base-sha>` tag. Their primary release tag names are:

| Tool | Primary release tag |
|------|---------------------|
| `agentbloat` | `<agent>-v<version>` for each changed agent package |
| `claude-code` | `cc-v<version>` |
| `codex` | `codex-v<version>` |
| `open-code-review` | `ocr-v<version>` |
| `pi-agent` | `pi-v<version>` |
| `omnigent` | `omnigent-v<version>` |
| `t3code` | `t3code-stable-v<version>` or `t3code-nightly-v<version>` |

## Rules

- Declare one primary variant in the workflow; it additionally owns `latest`.
- Treat `<variant>` and `latest` as moving convenience tags and repoint them only from
  the workflow's digest fan-out stage.
- Treat release and source-commit tags as immutable references; never repoint an existing
  tag to different content.
- Keep release tags primary-only unless a workflow and a real consumer require a different
  mapping. Do not add a new tag family without updating the owning workflow and docs.
- Helm charts publish to GHCR OCI as `oci://ghcr.io/<owner>/charts/<tool>` only when chart
  publishing is explicitly enabled; local charts are the current default.

## Foundation-image tags

A foundation image with no independently versioned upstream tool may use source commit
tags instead of version/base tags:

- A push that changes a variant Dockerfile or its shared distro assets under
  `images/base/agentimg/images/` publishes `<variant>-<12-char-commit-sha>` for only the
  affected variant, alongside its moving tags.
- A scheduled base-image refresh publishes only moving `<variant>` and, for the primary
  variant, `latest` tags.
- A manual rebuild publishes only moving tags unless explicitly tied to a source commit.

This exception keeps source changes traceable without creating a new immutable tag for
every automated package/base refresh. `base/agentimg` uses this policy.
