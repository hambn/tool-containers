# Change verification

Choose checks based on the risk and affected domain, then always run:

```sh
bash .agents/skills/repository-changes/scripts/validate-change.sh
```

The wrapper runs the static repository validator `.github/scripts/check-repo.py` and
whitespace checks for staged and unstaged changes. The validator covers agent-workspace
integrity, workflow YAML, Dockerfile and bake contracts, Renovate comments on `ARG` pins,
per-tool workflows, test layout, executable bits, Markdown links, documentation
frontmatter, Compose/Helm rendering when those tools are available, and the CI and Dev
Container recipes (workflow hardening, actionlint when installed, GitLab `script`
syntax, and JSON with Comments parsing). It never builds, pulls, or runs an image.

Linters that cannot be verified statically on every machine (for example hadolint,
shellcheck, shfmt, actionlint) run in the `lint` job of `.github/workflows/pr.yml`;
actionlint there also covers `tools/*/*/docs/github-actions/` workflows. Run
them locally when installed; otherwise say they are left to CI.

## Targeted checks

- **Images:** render the variants with `docker buildx bake --print` in the tool
  directory and inspect args and labels. Building and running images is CI's job (the
  tool's `<category>-<tool>.yml` workflow builds, tests, and scans every variant); do it
  locally only when the user authorizes it.
- **Image CI and Python:** inspect workflows and `.github/scripts/` against the
  `$container-images` CI guide. The wrapper discovers every `test_*.py` there. Render
  changed bake options with `--print`; do not build images for a static check. When
  Ruff is installed, run `ruff check --no-cache --config .github/ruff.toml .github/scripts`
  and `ruff format --check --no-cache --config .github/ruff.toml .github/scripts`.
  Python lint and actionlint also run in the `lint` job.
- **Platform docs:** render or lint the affected format and inspect secrets,
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
Trivy secret scan, and publication happen in the per-tool image workflows.
