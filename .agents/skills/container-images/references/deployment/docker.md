# Docker command recipes

Put copyable commands directly in `docs/docker/README.md`. Do not add `run.sh`,
`airgapped.run.sh`, or other launcher scripts for plain Docker recipes. Each fenced
example should contain one command so a reader can copy the example they need.

- Use the platform name `Docker command`; keep the directory slug `docker`.
- Mount `"$PWD:/workspace"` and select the working directory when the image needs it.
- Use `-it --rm` for interactive tools and `--rm` for one-shot tasks.
- Use a published moving tag from `ghcr.io/hambn/<tool>` and explain digest pinning once.
- Pass credentials from exported host variables with `-e`; never include secret values.
- Show separate examples for materially different needs, such as interactive and
  one-shot use, localhost and all-interface ports, or persistent application state.
- For web services, show localhost access first. Explain which interfaces each port
  mapping publishes and how to stop or remove named containers before reusing a name.
- Add socket mounts only in a separate example, with the required group and an
  explanation of host access. Do not use privileged mode.
- Keep commands consistent with image entrypoints, users, ports, and storage paths.

README structure is owned by `$documentation`. Runnable sibling files are optional
for Docker docs; a README alone is sufficient. Offline examples, when needed, use
separate `docker save`, `docker load`, and `docker run --pull=never` commands.
