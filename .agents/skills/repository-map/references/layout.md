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
│   └── trivyignore.yaml          # reviewed vulnerability exceptions
└── web-ui/                       # static documentation site
```

## Root files

- `AGENTS.md` is the only always-loaded instruction surface; Claude Code and Codex both
  read it, so there is no `CLAUDE.md`.
- `README.md` lists every image tool exactly once by category.
- Each tool directory is self-contained (`Dockerfile` with its pins, `docker-bake.hcl`
  with its variants); image mechanics are owned by `$container-images`.

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
├── requirements.txt              # repository validation dependency
├── requirements-lint.txt         # Python lint pin
├── ruff.toml                     # Python lint and formatting rules
├── ISSUE_TEMPLATE/
├── scripts/
│   ├── plan.py                  # parent pinning and build matrix selection
│   ├── build.py                 # per-architecture build, tests, scan and digest export
│   ├── publish.py               # registry tags, architecture pairs and signing
│   ├── dependents.py            # outdated-only workflow dispatches
│   ├── ci.py, image_common.py   # process helpers and shared layer/cache policy
│   ├── lint.py                  # verified lint tools and source checks
│   ├── check-repo.py            # CLI for repository_check.py + document_rules.py
│   ├── ghcr_cleanup.py          # GHCR pruning that keeps tagged images and signatures
│   ├── hub_readme.py            # Docker Hub README with absolute links
│   ├── validate_pr_metadata.py  # PR title/body policy
│   └── test_*.py                # job, cache, maintenance and document regressions
└── workflows/
    ├── tool-image.yml            # reusable image pipeline: plan → build → publish
    ├── <category>-<tool>.yml     # one per tool (base-core.yml, ai-codex.yml, …)
    ├── pr.yml                    # pull-request gate and lint
    ├── pr-labeler.yml
    └── web-ui.yml                # site build and Pages deploy
```

There is no Dependabot configuration; Renovate owns updates.

## Image projects

```text
tools/
├── base/
│   ├── README.md                 # category README: intro and ordered tool list
│   ├── core/                     # hardened alpine/ubuntu/wolfi base
│   └── devbox/                   # lite/full/browser dev images (+ packages/, rootfs/, scripts/)
└── ai/
    ├── README.md                 # category README
    └── <tool>/                   # agentbloat, claude-code, codex, omnigent,
        ├── README.md             #   open-code-review, pi-agent, t3code
        ├── Dockerfile
        ├── docker-bake.hcl
        ├── tests/
        └── docs/<platform>/
```

Every category directory has a `README.md` with frontmatter; `check-repo.py` requires it
and checks its `## Tools` list against the category's tool directories.

`ci` and `sandboxes` are catalog categories with no projects yet. A tool contains only
the platform docs it actually supports. README standards are owned by
`$documentation`; the web-ui site renders them.

## Web UI

`web-ui/` owns the static site generated at build time from the root catalog, every
category and tool README, and every platform doc README with its sibling files.
`web-ui/tests/fixtures/documents.yaml` holds the document-rule cases that both the web
UI tests and `.github/scripts/test_check_repo.py` run. Use `$web-ui`.

## Exact-inventory commands

```sh
git ls-files
git ls-files '.github/**' 'tools/**' 'web-ui/**'
find tools -mindepth 2 -maxdepth 2 -type d -print
(cd tools/ai/codex && docker buildx bake --print)
```
