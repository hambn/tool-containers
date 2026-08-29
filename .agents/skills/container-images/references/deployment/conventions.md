# Deployment conventions

Each supported platform lives at `images/<category>/<tool>/examples/<platform>/` and
contains a README plus runnable examples. Add only the platform required by the tool's
real use cases.

Read only the selected platform guide:

| Platform | Guide |
|---|---|
| Plain Docker | [docker.md](docker.md) |
| Docker Compose | [docker-compose.md](docker-compose.md) |
| Rootless Podman | [podman.md](podman.md) |
| Docker Swarm | [docker-swarm.md](docker-swarm.md) |
| Raw Kubernetes | [kubernetes.md](kubernetes.md) |
| Helm | [helm.md](helm.md) |

## Shared contract

- Put the exact run/apply command in a top-of-file comment where the format permits and
  in the platform README.
- Mount the user's workspace at `/workspace`. Require an explicit absolute host path
  where the platform expands a host bind mount.
- Keep credentials external: require environment variables, mounted files, or native
  secret stores and fail loudly when a required value is absent.
- Use the published GHCR image for connected examples. Air-gapped examples load a saved
  image or use a local build and must not assume registry access.
- Pin a deliberate tag or digest for repeatable long-running deployments; use `latest`
  only where the documented convenience trade-off is intended.
- Give containers the least privilege and resources compatible with the tool. Do not
  copy unsupported security fields between orchestrators.
- Keep names, image paths, commands, arguments, environment variables, ports, volumes,
  and secrets consistent with the Dockerfile and tool README.

Document structure, cross-links, and quality for each platform README are owned by
`$documentation`. Render or lint the artifact with the actual platform tooling when
available.
