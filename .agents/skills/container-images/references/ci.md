# Image CI and publication

Each image project has one `.github/workflows/<category>-<tool>.yml` workflow. Inspect a
current workflow with the same inheritance pattern rather than assembling one from
memory.

## Events and selection

- A push to `main` selects variants affected by changes to the project, its workflow, or
  shared `.github/scripts/` helpers.
- Manual dispatch is permitted only from `main` and normally builds all variants.
- Derived tools schedule update detection and react to successful upstream foundation or
  parent-image workflow completion.
- `base/agentimg` uses a weekly refresh that selects all variants so base and package
  repository updates are not missed.
- Pull requests never publish images. They use static repository validation only.

Keep path filters synchronized with every input that can alter output. A source-only or
parent-base refresh normally repoints moving tags; emit a primary immutable release tag
only when the owning upstream version actually changes.

## Plan, build by digest, push

1. **Plan** resolves upstream versions, discovers variants, resolves each final base
   reference to a digest, determines what changed, and exposes JSON-safe matrix and tag
   metadata through `GITHUB_OUTPUT`.
2. **Build** runs the selected variant matrix for `linux/amd64`, passes digest-pinned base
   arguments, builds from the correct context, labels source/upstream/base metadata,
   pushes content to GHCR by digest, emits SBOM and provenance attestations, smoke-tests
   the runtime, and blocks on HIGH/CRITICAL Trivy findings.
3. **Push** downloads the recorded digests and applies registry tags without rebuilding.
   Each job authenticates only to its target registry; GHCR is the digest source for
   Docker Hub fan-out.

Do not add arm64 through unproven QEMU emulation. Validate the toolchain on a native arm
runner, then merge architecture digests into a multi-platform manifest.

## Security and reliability

- Declare one `PRIMARY` variant; only it owns `latest` and normal release tags.
- Serialize each publisher with non-canceling concurrency and finite job timeouts.
- Pin every third-party action to a full 40-character commit SHA with a readable version
  comment; keep GitHub Actions Dependabot enabled.
- Grant the narrowest job permissions and secrets. Never echo credentials or pass them as
  Docker build arguments.
- Fail closed when diff classification, version resolution, base-digest inspection,
  immutable-tag safety, build, smoke test, scan, or fan-out cannot establish success.
- Use a distinct BuildKit cache scope for every image and variant.
- Do not hardcode a version that the plan job owns; pass it as a build argument and keep
  tags aligned with [registry policy](registries-and-tags.md).

## Validation boundary

The PR validator requires one publisher and one root catalog entry per image project,
parses workflow YAML and embedded Bash, checks pinned actions and publisher hardening,
enforces Dockerfile/runtime contracts, checks executable bits and Markdown links, and
renders Compose/Helm when tools are available. It intentionally does not build, pull,
execute, scan, or publish an image. Run a targeted BuildKit check, representative build,
and runtime smoke test locally when the modified behavior warrants them, and report any
unavailable check explicitly.
