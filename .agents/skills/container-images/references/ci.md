# Image CI and automation

Dockerfiles and `src/tools/docker-bake.hcl` with `src/tools/versions.hcl` define every build. From the repository root, render the graph with:

```sh
docker buildx bake -f src/tools/docker-bake.hcl -f src/tools/versions.hcl --print all
```

The Go module in `src/ci/` reads that rendered graph. `ci plan` discovers published targets through group `all`, infers ownership from `src/tools/<category>/<tool>` contexts, and follows named target dependencies to any depth. A new category, image, or variant requires no Go or workflow YAML edit.

`.github/workflows/images.yml` plans affected targets into at most 16 jobs. Each job builds a tool's variants for amd64 and arm64, tests their structure and smoke behavior, scans amd64 with Trivy, and on eligible main runs pushes verified digests. A failed tool does not stop later tools in the same job. The publish job assembles two-architecture indexes, preserves existing immutable tags, updates moving tags, mirrors to Docker Hub, signs indexes, and writes provenance subjects. Missing per-architecture digests prevent that target's publication.

`.github/workflows/maintenance.yml` uses the Go CLI for catalog discovery, scheduled OS vulnerability rescans, OS_REFRESH pull requests, safe GHCR cleanup, and Docker Hub README rewriting. `.github/workflows/pr.yml` runs the PR gate, dependency review, Go tests, static validator and linters. Workflows keep explicit permissions, runner versions, timeouts, concurrency, and pinned actions.

Run `(cd src/ci && go test ./...)` after changing orchestration. Run `ci validate` from the repository root after building `src/ci/cmd/ci`. For image changes, render the Bake graph and run the appropriate local Docker build when authorized. Do not publish, dispatch workflows, or change registry settings without user authorization.
