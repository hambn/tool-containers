# Image-project layout

The ownership boundary is `src/tools/<category>/<tool>/`. `<category>` groups purpose
(`base`, `ai`; `ci` and `sandboxes` are catalog categories with no projects yet),
`<tool>` is one published image repository, and `<variant>` is one published profile of
it. The build graph is shared: every target lives in `src/tools/docker-bake.hcl` and every
pin in `src/tools/versions.hcl`.

## Standard tree

```text
src/tools/<category>/<tool>/
├── README.md
├── Dockerfile                 # one per tool; per-distro named stages
├── tests/
│   ├── structure.yaml         # container-structure-test, every variant
│   ├── structure-<x>.yaml     # optional distro/tier/variant additions
│   ├── smoke.sh               # optional runtime check
│   └── trivy-skip-files.txt   # optional upstream binaries the scan gate skips
└── examples/<platform>/
    ├── README.md
    └── runnable files
```

`src/tools/base/devbox/` also owns `packages/` (plain-text package lists), `rootfs/` (the
config layer), and `scripts/` (build-time helpers). There are no `images/` directories
and no per-tool workflows.

A tool's build context is its own directory. Cross-tool inputs arrive only through bake
`contexts` (for example `base`, `core`, `devbox-config`); never `COPY` from another tool's
path. The `references/deployment/` directory belongs to this skill; image projects always
use `examples/`.

## Naming

- Lowercase kebab-case category, tool, variant, and platform directory names.
- Tool and variant names are public registry identifiers; renaming one is a migration
  (see [registries and tags](registries-and-tags.md)).
- Bake target names are `<tool>-<variant>`; internal targets use `-payload`/`-config`.
- Scenario files are `<scenario>.<base-name>`, for example
  `airgapped.docker-compose.yml`; the ordinary case keeps the base name.

## Adding a tool

1. Pick the closest existing tool with the same parent (devbox payload or agentbloat
   payload) and read every file before copying its shape.
2. Write `Dockerfile` per [Dockerfiles](images/dockerfile.md).
3. Add the tool's `<TOOL>_VERSION` pin with its Renovate comment to `src/tools/versions.hcl` per
   [versions and pins](versions.md).
4. Add a matrix target to `src/tools/docker-bake.hcl` modeled on a sibling (context, `DISTRO` and
   version args, `contexts`, tags, labels, cache) and list it in the `agents` or `base`
   group so group `all` publishes it. Render it with
   `docker buildx bake -f src/tools/docker-bake.hcl -f src/tools/versions.hcl --print <tool>`.
5. Add `tests/structure.yaml` and, when runtime behavior needs it, `tests/smoke.sh` per
   [testing](testing.md). List statically linked upstream binaries the tool installs in
   `tests/trivy-skip-files.txt`.
6. Add the README, only the platform examples that serve real use cases
   ([conventions](deployment/conventions.md)), and one root catalog row, all per
   `$documentation`.
7. Confirm the Go planner discovers the new target (run `go test ./...` in `src/ci/`) and that
   `images.yml` needs no per-tool edit; see [CI](ci.md).
8. Replace every copied name, image path, command, label, and source link; compare the
   file map with `git ls-files`.

Put shared runtime capability in a published tier (core or devbox) rather than copying
files between tools. Do not create a category or tier for one speculative use.
