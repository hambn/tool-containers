# Repository layout

Use `git ls-files` for the exact inventory and the root `README.md` for the public catalog.

```text
tool-containers/
├── AGENTS.md
├── README.md
├── .agents/skills/               # agent guidance
├── .github/                     # collaboration, Renovate, and workflows
│   └── workflows/               # GitHub-required location
└── src/
    ├── ci/                      # Go CLI, internal packages, and tests
    ├── tools/                   # image projects, Bake graph, pins, Trivy policy
    └── web-ui/                  # static documentation site
```

`src/tools/docker-bake.hcl` and `src/tools/versions.hcl` are loaded together from the repository root. The Dockerfiles and rendered Bake graph define builds. `src/ci/` reads the graph and runs CI; local Docker builds never require Go. The Go module owns repository validation and automation formerly in `.github/scripts/`.

`src/tools/<category>/<tool>/` is the repeatable image project path. `src/web-ui/` discovers the root catalog and every tool and example README at build time. Generated public routes retain `/docs/<category>/<tool>/` regardless of source location.

Useful inventory commands:

```sh
git ls-files 'src/**' '.github/**'
docker buildx bake -f src/tools/docker-bake.hcl -f src/tools/versions.hcl --print all
(cd src/ci && go test ./...)
```
