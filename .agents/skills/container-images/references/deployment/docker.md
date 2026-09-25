# Docker run recipes

Use executable Bash scripts for connected and air-gapped plain Docker use:

| File | Purpose |
|---|---|
| `run.sh` | pull and run the published image |
| `airgapped.run.sh` | load a saved tar and run without pulling |
| `README.md` | prerequisites, file map, commands, variables, and cleanup |

## Script rules

- Start with `#!/usr/bin/env bash` and `set -euo pipefail`.
- Assert required variables before invoking Docker; never provide fake secret defaults.
- Mount `"$PWD:/workspace"`. Use `-it --rm` for interactive tools and pass `"$@"`
  through after the image.
- Use a moving variant tag such as `ghcr.io/hambn/<tool>:ubuntu-browser`, or an
  immutable tag where repeatability matters.
- Add only required capabilities, devices, ports, and environment variables. Do not use
  privileged mode as a shortcut.
- Keep the scripts executable and shell-quote all user paths and arguments.

## Air-gapped flow

On a connected host, pull and save the exact image:

```sh
docker save ghcr.io/hambn/<tool>:<tag> -o <tool>.tar
```

The offline script accepts the tar path as its first argument, defaulting to
`<tool>.tar`, calls `docker load -i`, and runs with `--pull=never`. Separate the tar-path
argument from arguments passed to the tool, and document how the local loaded tag is
selected.
