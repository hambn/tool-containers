# Image-project layout

The ownership boundary is `tools/<category>/<tool>/`. `<category>` groups purpose
(`base`, `ai`; `ci` and `sandboxes` are catalog categories with no projects yet),
`<tool>` is one published image repository, and `<variant>` is one published profile of
it. Each tool directory is self-contained: its `Dockerfile` carries every pin as an `ARG`
default and its `docker-bake.hcl` lists its variants.

## Standard tree

```text
tools/<category>/<tool>/
├── README.md
├── Dockerfile                 # one per tool; pinned ARG defaults, per-distro stages
├── docker-bake.hcl            # the tool's variants: labels and BASE_IMAGE per variant
├── tests/
│   ├── structure.yaml         # container-structure-test, every variant
│   ├── structure-<x>.yaml     # optional distro/tier/variant additions
│   └── smoke.sh               # optional runtime check
└── examples/<platform>/
    ├── README.md
    └── runnable files
```

`tools/base/devbox/` also owns `packages/` (plain-text package lists), `rootfs/` (the
config layer), and `scripts/` (build-time helpers). There are no `images/` directories.
Each tool has one workflow, `.github/workflows/<category>-<tool>.yml` ([CI](ci.md)).

A tool's build context is its own directory. Cross-tool inputs arrive only through the
published parent image named by `ARG BASE_IMAGE`; never `COPY` from another tool's
path. The `references/deployment/` directory belongs to this skill; image projects always
use `examples/`.

## Naming

- Lowercase kebab-case category, tool, variant, and platform directory names.
- Tool and variant names are public registry identifiers; renaming one is a migration
  (see [registries and tags](registries-and-tags.md)).
- Bake target names are `<tool>-<variant>`; every target carries the
  `io.github.hambn.containers.{variant,distro,tier}` labels.
- Scenario files are `<scenario>.<base-name>`, for example
  `airgapped.docker-compose.yml`; the ordinary case keeps the base name.

## Adding a tool

1. Pick the closest existing tool with the same parent (devbox or agentbloat) and read
   every file before copying its shape.
2. Write `Dockerfile` per [Dockerfiles](images/dockerfile.md), with its pins and
   Renovate comments per [versions and pins](versions.md).
3. Add `docker-bake.hcl` modeled on a sibling: one matrix target named
   `<tool>-<variant>` with the variant, distro, and tier labels and each variant's
   `BASE_IMAGE`, in group `default`. Render it with `docker buildx bake --print` from
   the tool directory.
4. Add `tests/structure.yaml` and, when runtime behavior needs it, `tests/smoke.sh` per
   [testing](testing.md).
5. Copy a sibling workflow to `.github/workflows/<category>-<tool>.yml` and adjust its
   name, paths, upstream `workflow_run`, cron minute, concurrency group, and inputs; see
   [CI](ci.md).
6. Add the README, only the platform examples that serve real use cases
   ([conventions](deployment/conventions.md)), and one root catalog row, all per
   `$documentation`.
7. Run `.github/scripts/check-repo.py`; it checks the required files and the workflow.
8. Replace every copied name, image path, command, label, and source link; compare the
   file map with `git ls-files`.

Put shared runtime capability in a published tier (core or devbox) rather than copying
files between tools. Do not create a category or tier for one speculative use.
