# Change verification

Build and test the Go CI module, then run its static repository validator from the repository root:

```sh
(cd src/ci && go test ./... && go build -o /tmp/tool-containers-ci ./cmd/ci)
/tmp/tool-containers-ci validate
git diff --check
git diff --cached --check
```

The validator checks workflow hardening, the PR gate and labeler, issue forms, agent workspace, Bake contexts, tool and catalog inventories, version pin annotations, Markdown links, shell syntax, Compose and Helm rendering when available. It never builds or pulls an image. Run it again after staging intended paths so the staged diff is checked.

For image changes, render `docker buildx bake -f src/tools/docker-bake.hcl -f src/tools/versions.hcl --print <target>` and inspect contexts, args, tags and labels. Run relevant local builds only when authorized. For the web UI, run its declared build and tests in default and explicit subpath modes. CI runs linters and image builds, tests, scans and publication when local tools or credentials are unavailable.

Report exact commands and outcomes, including skipped checks and their reasons.
