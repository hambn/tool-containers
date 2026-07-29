# Podman

Run `./run.sh` for a rootless interactive shell with the current directory mounted at
`/workspace`. Set `AGENTIMG_IMAGE=ghcr.io/hambn/agentimg:<variant>` to select a variant.
The `:Z` mount option relabels the workspace on SELinux hosts.
