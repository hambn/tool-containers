# Docker example

Run a minimal foundation locally. Install Docker and pull access to GHCR first.

```sh
./run.sh alpine-3.21-minimal
./run.sh ubuntu-24.04-minimal
```

The container runs with its built-in UID/GID 1000 user. The script checks the shell and `curl`, then exits. It does not mount a workspace or request secrets. See the [runtime image contract](../../README.md) for the published tags.

## File map

- [`run.sh`](run.sh) runs the selected profile.
- [`../../README.md`](../../README.md) describes both images.
