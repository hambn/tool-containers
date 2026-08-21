# Dockerfiles

Keep one `Dockerfile` per variant. Derived tools use a variant directory as their build
context; do not depend on files outside it. `images/base/agentimg` is the deliberate
exception: its four `*.Dockerfile` variants share the tool's `images/` context so they
can reuse distro-local scripts and common shell assets.

## Versions and bases

- Use build arguments for upstream and base versions. When a Dockerfile is a supported
  direct or air-gapped build entrypoint, pin its default base reference to an immutable
  digest while allowing CI to pass a freshly resolved digest-pinned override.
- Give upstream tool-version arguments a usable default such as `latest` or the current
  supported major.
- Let CI resolve the upstream release and pass it as a build argument.
- State the chosen base and functional profile in the first comment.
- Keep the base version visible to Renovate or the repository's chosen update tool.

## Layers and cleanup

- Group related package installation in one `RUN` and clean its cache in that layer.
- Use `apk add --no-cache` on Alpine; remove `/var/lib/apt/lists/*` after Debian/Ubuntu
  installation; clear npm caches after npm installs.
- Order stable layers before frequently changing layers.

## Security and runtime

- Run as a non-root user unless the runtime genuinely requires root; document that reason.
- Use `/workspace` as the work directory to match deployment mounts.
- Never bake credentials into an image. Require runtime secrets through environment variables,
  mounted files, or the platform's secret store.
- Install only what the variant's profile needs.
- Mark deliberate limitations with a `# ponytail:` comment and state the upgrade path.
