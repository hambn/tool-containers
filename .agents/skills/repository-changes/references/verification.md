# Change verification

Choose checks based on the risk and affected domain, then always run:

```sh
bash .agents/skills/repository-changes/scripts/validate-change.sh
```

The wrapper runs the static repository validator `.github/scripts/check-repo.py` and
whitespace checks for staged and unstaged changes. The validator covers agent-workspace
integrity, workflow YAML, Dockerfile and bake contracts, `versions.hcl` pins, test
layout, executable bits, Markdown links, and Compose/Helm rendering when those tools are
available. It never builds, pulls, or runs an image.

Linters that cannot be verified statically on every machine (for example hadolint,
shellcheck, shfmt, actionlint) run in the `lint` job of `.github/workflows/pr.yml`. Run
them locally when installed; otherwise say they are left to CI.

## Targeted checks

- **Images:** render the graph with
  `docker buildx bake -f docker-bake.hcl -f versions.hcl --print <target>` and inspect
  contexts, args, tags, and labels. Building and running images is CI's job
  (`images.yml` builds, tests, and scans affected targets); do it locally only when the
  user authorizes it.
- **CI planner:** run the planner tests in `.github/scripts/test_plan.py` after changing
  the planner, the bake graph shape, or tool paths.
- **Deployment examples:** render or lint the affected format and inspect secrets,
  mounts, image references, and offline behavior.
- **GitHub Actions:** inspect events, path filters, permissions, secrets, concurrency,
  matrix selection, shell, and publication gates.
- **Markdown and maps:** verify local links and compare claimed paths with `git ls-files`.
- **Web UI:** run the commands selected by `$web-ui`.
- **Agent skills:** run each changed helper script.

After explicitly staging the intended paths, rerun the wrapper so cached whitespace is
also checked.

## Truthful reporting

Report each exact command and outcome. If Docker, Helm, a linter, network access, or
credentials are unavailable, name the skipped check and the reason. Do not claim a
runtime result from static validation: the `Pull request gate` covers metadata policy,
dependency review, and the static validator; `lint` covers linters; image build, tests,
Trivy scan, and publication happen in `images.yml`.
