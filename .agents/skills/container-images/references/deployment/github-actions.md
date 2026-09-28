# GitHub Actions recipes

A `docs/github-actions/` directory holds a copyable workflow:

| File | Purpose |
|---|---|
| `workflow.yml` | workflow users copy to `.github/workflows/`; its first line says where |
| `README.md` | prerequisites, secrets and variables, Files section, and limitations |

## Workflow rules

- Follow the repository's own workflow hardening: top-level `permissions: {}`, job-level
  `contents: read` unless the recipe needs more, `concurrency`, a job `name`,
  `timeout-minutes`, a pinned runner such as `ubuntu-24.04`, and actions pinned to a full
  commit SHA with a `# vX` comment. `actions/checkout` sets `persist-credentials: false`.
- **One-shot CLIs** run in a `docker run --rm` step on the runner, with the checkout
  mounted read-only at `/workspace`. This keeps the image's non-root `sysadmin` user.
  The checkout belongs to the runner user (UID 1001), so pass
  `-e GIT_CONFIG_COUNT=1 -e GIT_CONFIG_KEY_0=safe.directory -e GIT_CONFIG_VALUE_0=/workspace`
  when the tool runs Git inside the container.
- **Toolchain images** (devbox) may run as a job `container:`. The runner replaces the
  image entrypoint and owns the workspace as UID 1001, and
  [actions/checkout does not support](https://github.com/actions/checkout/issues/956) a
  non-root container user, so set `options: --user root` and say so in the README.
- Pass secrets through step-level `env:` from `${{ secrets.<NAME> }}` and forward them
  with `-e <NAME>`; never at workflow or job level. Pull request recipes skip forks
  (`github.event.pull_request.head.repo.full_name == github.repository`) because GitHub
  does not pass secrets to fork-triggered runs. Do not use `pull_request_target` to run
  an agent on untrusted code.
- Use the lightest Ubuntu variant tag (`ubuntu`, or `ubuntu-full` for devbox); CI never
  needs the browser tier unless the recipe drives Chromium.
- Use `shell: bash` on steps that pipe, so pipefail applies. Write model output to
  `$GITHUB_STEP_SUMMARY` or the log; recipes that post comments need
  `pull-requests: write` and a README note on the extra permission.

`check-repo.py` applies the hardening rules and `bash -n` to these workflows, and runs
actionlint on them when it is installed; the `lint` job in `pr.yml` always does.
