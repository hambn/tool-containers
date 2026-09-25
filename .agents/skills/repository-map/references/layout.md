# Repository layout

This map describes what each area owns. Use `git ls-files` for the exact inventory and
the root `README.md` catalog for the public list of tools.

```text
tool-containers/
├── AGENTS.md                     # mandatory skill trigger router
├── CLAUDE.md                     # compatibility pointer to AGENTS.md
├── README.md                     # public image catalog
├── LICENSE
├── .gitignore
├── docker-bake.hcl               # build graph: every image target, tags, labels
├── versions.hcl                  # every pin (base digests, tool versions, OS_REFRESH)
├── renovate.json5                # dependency updates for pins and actions
├── .trivyignore.yaml             # reviewed vulnerability exceptions
├── .agents/skills/               # repository-local agent capabilities
├── .github/                      # collaboration, validation, and delivery
├── tools/                        # image projects
└── web-ui/                       # static documentation site
```

## Root files

- `AGENTS.md` is the only always-loaded instruction surface; `CLAUDE.md` only points to it.
- `README.md` lists every image tool exactly once by category.
- `docker-bake.hcl` and `versions.hcl` are always loaded together; image mechanics are
  owned by `$container-images`.

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
├── requirements.txt              # Python dependencies of repository scripts
├── ISSUE_TEMPLATE/
├── scripts/
│   ├── check-repo.py             # static repository validator
│   ├── plan.py                   # image CI planner (affected targets)
│   ├── test_plan.py
│   ├── validate_pr_metadata.py   # PR title/body policy
│   └── test_validate_pr_metadata.py
└── workflows/
    ├── images.yml                # plan → build/test matrix → publish, all images
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
docker buildx bake -f docker-bake.hcl -f versions.hcl --print all
```
