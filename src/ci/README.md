# Repository CI

`src/ci/` is the Go module for repository validation, image automation and scheduled
maintenance. Build it with `cd src/ci && go build -o /tmp/tool-containers-ci ./cmd/ci`.
Run the binary from the repository root so it reads the tracked Bake files and docs.

| Command | Purpose |
|---|---|
| `bake` | Invoke Docker Buildx Bake with commit-derived metadata |
| `plan` | Select affected published targets from the rendered Bake graph |
| `build` | Build, test, scan and optionally push each tool's variants on both architectures |
| `publish` | Assemble, mirror and sign indexes from architecture digests |
| `pr`, `validate`, `lint` | Check PR metadata, static repository contracts and linters |
| `catalog`, `rescan`, `os-refresh` | Discover moving tags and maintain OS packages |
| `cleanup`, `cleanup-catalog`, `hub-readme` | Prune safe GHCR versions and rewrite Docker Hub links |
| `install`, `qemu-check`, `reports`, `subjects` | Install pinned test tools and inspect runner or result state |

The [image workflow](../../.github/workflows/images.yml) builds the CLI separately in
each job. Jobs share digest files through GitHub artifacts. Dockerfiles and
[Buildx Bake](../tools/docker-bake.hcl) define builds; the CLI reads the rendered
graph and adds no image-specific build recipes. Local builds use ordinary Docker
commands shown in the [root catalog](../../README.md#local-builds).

Run `go test ./...` from this directory. Run `/tmp/tool-containers-ci validate` from
the repository root after building. Neither command publishes images.
