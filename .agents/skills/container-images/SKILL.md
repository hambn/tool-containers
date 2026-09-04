---
name: container-images
description: Add, change, review, or troubleshoot a container project under tools/ and its coupled README, Dockerfiles, variants, platform examples, root catalog entry, publication workflow, registries, and tags. Use for any tools/ change or its matching image-delivery automation; do not use for the application under web-ui/.
---

# Container images

Own the complete image-project lifecycle while loading only the detail needed for the
current task.

## Route the task

- **Add or reorganize a tool:** read [project layout](references/project-layout.md),
  use `$documentation` for every written document, read the relevant image and
  platform-example guides, then [CI](references/ci.md).
- **Write or review a README or other document:** follow `$documentation`; this skill
  owns only the mechanics behind the documents.
- **Choose or rename a profile:** read [variants](references/images/variants.md), then
  [base images](references/images/base-images.md) when the runtime base is in question.
- **Write or review a Dockerfile:** read
  [Dockerfiles](references/images/dockerfile.md) and, when applicable, the variants and
  base-image guides.
- **Add or change a platform example:** read
  [platform example conventions](references/deployment/conventions.md), then only the
  selected platform guide linked there.
- **Change publishing, update detection, registries, or tags:** read
  [CI](references/ci.md) and [registries and tags](references/registries-and-tags.md).
- **Touch a special inheritance or compatibility rule:** read
  [tool-specific contracts](references/tool-specific-contracts.md).

## Workflow

1. Inspect the target project, its closest valid neighbor, root catalog row, matching
   `.github/workflows/<category>-<tool>.yml`, and actual published tag contract.
2. Identify every coupled surface before editing: Dockerfiles, shared build assets,
   platform examples, tool README/file map, workflow planning and tags, and root
   catalog.
3. Keep build contexts self-contained, runtime secrets external, deployment workspace
   mounts at `/workspace`, and published names backward-compatible unless the user
   requests a migration.
4. Validate the narrowest affected artifacts and run the repository validation from
   `$repository-changes`. Static validation is not a substitute for a representative
   image build or smoke test when runtime behavior changed.
5. Invoke `$maintain-agent-workspace` after every image mutation. Update this skill's
   owning reference only when the change alters a reusable image convention; never
   record chronological memory.

Do not publish images, dispatch workflows, change registry settings, or expose secrets
unless the user explicitly authorizes that external mutation.
