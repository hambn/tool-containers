# Repository layout

This map describes what each area owns. Use `git ls-files` for the exact current file
inventory and the root `README.md` catalog for the current public list of tools.

```text
tool-containers/
├── AGENTS.md                     # mandatory skill trigger router
├── CLAUDE.md                     # compatibility pointer to AGENTS.md
├── README.md                     # public image catalog
├── LICENSE                       # repository license
├── .gitignore                    # local/generated state exclusions
├── .agents/skills/               # repository-local agent capabilities
├── .github/                      # GitHub collaboration, validation, and delivery
├── tools/                        # self-contained container image projects
└── web-ui/                       # repository web application boundary
```

## Root files

- `AGENTS.md` is the only always-loaded repository instruction surface.
- `CLAUDE.md` points compatible clients to `AGENTS.md`; it does not duplicate policy.
- `README.md` describes the repository and lists every image tool exactly once by
  category.
- `LICENSE` contains the repository's software license.
- `.gitignore` excludes local agent configuration and generated local state.

## Agent skills

Each immediate `.agents/skills/<skill>/` directory is one discoverable capability and
contains `SKILL.md`. Conditional detail belongs in that skill's `references/`; repeated
deterministic mechanics belong in `scripts/`. There are no global agent references,
workflows, memory logs, or secondary router.

## GitHub controls

```text
.github/
├── CODEOWNERS                    # review ownership
├── CONTRIBUTING.md               # human contribution handoff
├── SECURITY.md                   # vulnerability reporting
├── dependabot.yml                # dependency update configuration
├── labeler.yml                   # path-based pull-request labels
├── pull_request_template.md      # Summary/Validation PR shape
├── requirements.txt              # Python dependency used by repository validation
├── ISSUE_TEMPLATE/               # issue forms and picker config
├── scripts/
│   ├── registry-inspect.sh       # registry metadata helper used by publishers
│   ├── validate-repository.sh    # shared static validation entry point
│   ├── validate_pr_metadata.py   # PR title/body policy implementation
│   └── test_validate_pr_metadata.py # PR metadata regression tests
└── workflows/
    ├── ai-<tool>.yml             # one publisher for each AI image project
    ├── base-agentimg.yml         # foundation-image publisher
    ├── pull-request.yml          # combined metadata, dependency, and static gate
    ├── pr-labeler.yml            # label automation
```

The current image publishers are `ai-agentbloat.yml`, `ai-claude-code.yml`,
`ai-codex.yml`, `ai-omnigent.yml`, `ai-open-code-review.yml`, `ai-pi-agent.yml`,
`ai-t3code.yml`, and `base-agentimg.yml`.

## Image projects

The repeatable ownership boundary is `tools/<category>/<tool>/`:

```text
tools/<category>/<tool>/
├── README.md                     # public tool contract and linked file map
├── images/                       # build contexts and Dockerfiles
└── examples/<platform>/          # runnable examples plus platform README
```

Current categories and tools are:

- `tools/ai/`: `agentbloat`, `claude-code`, `codex`, `omnigent`,
  `open-code-review`, `pi-agent`, and `t3code`.
- `tools/base/`: `agentimg`, the shared foundation project.
- `ci` and `sandboxes` are catalog concepts with no project directories yet.

Derived tools keep `images/<variant>/Dockerfile`. `tools/base/agentimg` deliberately
keeps four flat `images/*.Dockerfile` files because its variants share distro-local
scripts and common shell assets in one build context. A tool supports only the platform
examples it actually contains; do not infer that all six platform directories are
mandatory. Standards for every README in this tree are owned by `$documentation`, and
the web-ui site renders them verbatim.

## Web UI

`web-ui/` owns the static documentation-showcase website: a GitHub Pages site generated
at build time from the root catalog and every image/example README. It holds the
application source, configuration, static assets, tests, and local documentation once
present. Inspect its live files and use `$web-ui` for its settled product and technical
contract; document standards for the content it renders live in `$documentation`.

## Exact-inventory commands

```sh
git ls-files
git ls-files '.github/**' 'tools/**' 'web-ui/**'
find tools -mindepth 2 -maxdepth 2 -type d -print
find .agents/skills -mindepth 1 -maxdepth 1 -type d -print
```
