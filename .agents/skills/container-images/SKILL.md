---
name: container-images
description: Add, change, review, or troubleshoot a container project under src/tools/ and its coupled Dockerfile, src/tools/docker-bake.hcl target, src/tools/versions.hcl pins, tests, README, platform examples, root catalog entry, registries, tags, and image CI (images.yml, maintenance.yml, .github/renovate.json5). Use for any src/tools/ change or image-delivery automation; do not use for the application under src/web-ui/.
---

# Container images

Own the image build graph and every image project's lifecycle. Load only the detail the
current task needs.

## Route the task

- **Add or reorganize a tool:** read [project layout](references/project-layout.md),
  then the image, testing, and platform-example guides it links. Use `$documentation`
  for every README.
- **Understand inheritance or pick a base/tier:** read [tiers](references/images/tiers.md)
  and [variants](references/images/variants.md).
- **Write or review a Dockerfile:** read [Dockerfiles](references/images/dockerfile.md).
- **Bump, add, or hold a version or base digest; refresh OS packages:** read
  [versions and pins](references/versions.md).
- **Change tags, registries, or labels:** read
  [registries, tags, and labels](references/registries-and-tags.md).
- **Add or change image tests:** read [testing](references/testing.md).
- **Change build, publish, scan, or update automation:** read [CI](references/ci.md).
- **Add or change a platform example:** read
  [platform example conventions](references/deployment/conventions.md), then only the
  platform guide linked there.
- **Touch agentbloat, omnigent, or a `# ponytail:` limitation:** read
  [tool-specific contracts](references/tool-specific-contracts.md).

## Workflow

1. Inspect the target `src/tools/<category>/<tool>/`, its closest neighbor, its targets in
   `src/tools/docker-bake.hcl`, its pins in `src/tools/versions.hcl`, and the root catalog row.
2. Identify every coupled surface before editing: Dockerfile, bake target and group
   membership, version pins, tests, README and file map, examples, catalog row.
3. Render the build graph instead of guessing it:
   `docker buildx bake -f src/tools/docker-bake.hcl -f src/tools/versions.hcl --print <target>`.
4. Validate with `$repository-changes`. Static validation never proves runtime
   behavior; `images.yml` builds, tests, and scans affected images (see [CI](references/ci.md)).
5. Invoke `$maintain-agent-workspace`; update a reference here only when a reusable
   image convention changed.

Do not build or run images, publish, dispatch workflows, change registry settings, or
expose secrets unless the user explicitly authorizes it.
