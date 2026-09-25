# Repository layout

This map describes what each area owns. Use `git ls-files` for the exact inventory and
the root `README.md` catalog for the public list of tools.

```text
tool-containers/
├── AGENTS.md                     # mandatory skill trigger router
├── README.md                     # public image catalog
├── LICENSE
├── .gitignore
├── .agents/skills/               # repository-local agent capabilities
├── .github/                      # collaboration, validation, and delivery
├── tools/                        # image projects, plus:
│   ├── docker-bake.hcl           # build graph: every image target, tags, labels
│   ├── versions.hcl              # every pin (base digests, tool versions, OS_REFRESH)
│   └── trivyignore.yaml          # reviewed vulnerability exceptions
└── web-ui/                       # static documentation site
```

## Root files

- `AGENTS.md` is the only always-loaded instruction surface; Claude Code and Codex both
  read it, so there is no `CLAUDE.md`.
- `README.md` lists every image tool exactly once by category.
- `tools/docker-bake.hcl` and `tools/versions.hcl` are always loaded together, from the
  repository root, through `.github/scripts/bake.sh`; image mechanics are owned by
  `$container-images`.

## Agent skills

Each `.agents/skills/<skill>/` directory is one discoverable capability with `SKILL.md`,
optional `references/` for conditional detail, and `scripts/` for deterministic
mechanics. There are no global agent references, memory logs, or secondary routers.

## GitHub controls

```text
.github/
├── CODEOWNERS
├── CONTRIBUTING.md
├── SECURITY.md
├── labeler.yml                   # path-based pull-request labels
├── pull_request_template.md      # Summary/Validation/Checklist PR shape
├── renovate.json5                # dependency updates for pins and actions
├── requirements.txt              # Python dependencies of repository scripts
├── ISSUE_TEMPLATE/
├── scripts/
│   ├── check-repo.py             # static repository validator
│   ├── bake.sh                   # docker buildx bake with the repository's Bake files
│   ├── plan.py                   # affected image targets packed into bounded jobs
│   ├── build-tools.sh            # build/test/scan/push the tools of one job
│   ├── publish.sh                # multi-arch indexes, Docker Hub mirror, signatures
│   ├── test_build_tools.py
│   ├── test_plan.py
│   ├── validate_pr_metadata.py   # PR title/body policy
│   └── test_validate_pr_metadata.py
└── workflows/
    ├── images.yml                # Test and build: plan → bounded tool jobs → publish
    ├── pr.yml                    # pull-request gate and lint
    ├── pr-labeler.yml
    ├── web-ui.yml                # site build and Pages deploy
    └── maintenance.yml           # scheduled scans and OS_REFRESH PRs
```

There is no Dependabot configuration; Renovate owns updates.

## Image projects

```text
tools/
├── base/
│   ├── core/                     # hardened alpine/ubuntu/wolfi base
│   └── devbox/                   # lite/full/browser dev images (+ packages/, rootfs/, scripts/)
└── ai/<tool>/                    # agentbloat, claude-code, codex, omnigent,
    ├── README.md                 #   open-code-review, pi-agent, t3code
    ├── Dockerfile
    ├── tests/
    └── examples/<platform>/
```

`ci` and `sandboxes` are catalog categories with no projects yet. A tool contains only
the platform examples it actually supports. README standards are owned by
`$documentation`; the web-ui site renders them.

## Web UI

`web-ui/` owns the static site generated at build time from the root catalog, every
tool README, and every example README with its sibling files. Use `$web-ui`.

## Exact-inventory commands

```sh
git ls-files
git ls-files '.github/**' 'tools/**' 'web-ui/**'
find tools -mindepth 2 -maxdepth 2 -type d -print
.github/scripts/bake.sh --print all
```
