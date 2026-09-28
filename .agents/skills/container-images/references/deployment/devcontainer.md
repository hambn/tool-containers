# Dev Container recipes

A `docs/devcontainer/` directory holds a file users copy to
`.devcontainer/devcontainer.json`:

| File | Purpose |
|---|---|
| `devcontainer.json` | JSON with Comments; its first line says where to copy it |
| `README.md` | editor and CLI prerequisites, commands, Files section, and limitations |

## File rules

- Offer Dev Containers only for images people work inside (devbox, agentbloat). The
  Dev Containers CLI starts containers with its own entrypoint, so a CLI `ENTRYPOINT`
  never runs.
- Set `"remoteUser": "sysadmin"` so Linux hosts remap the user to the caller's UID
  (`updateRemoteUserUID` defaults to true).
- Mount the project at `/workspace` with
  `"workspaceMount": "source=${localWorkspaceFolder},target=/workspace,type=bind"` and
  `"workspaceFolder": "/workspace"`.
- Add `"runArgs": ["--shm-size=1g"]` for `*-browser` variants that run Chromium.
- Keep credentials out of the file; document `remoteEnv` with `${localEnv:<NAME>}` for
  keys a user wants forwarded.
- Document `devcontainer up --workspace-folder .` and `devcontainer exec` as the CLI
  commands, and the [JSON reference](https://containers.dev/implementors/json_reference/)
  for other properties.

`check-repo.py` parses the file as JSON with Comments and requires `image`.
