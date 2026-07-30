# Podman

Run `./run.sh review` for a rootless OCR review with the current directory mounted at
`/workspace`. Set `OCR_IMAGE=ghcr.io/hambn/open-code-review:<variant>` to select a
variant. The `:Z` mount option supports SELinux hosts.
