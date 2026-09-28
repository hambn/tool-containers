# GitLab CI recipes

A `docs/gitlab-ci/` directory holds a job users add to their `.gitlab-ci.yml`:

| File | Purpose |
|---|---|
| `gitlab-ci.yml` | one job; its first line says how to add it and which variables to set |
| `README.md` | runner prerequisites, CI/CD variables, Files section, and limitations |

## Job rules

- Target the Docker executor. It keeps the image's `USER` and passes a shell as the
  command to the image `ENTRYPOINT`, so images whose entrypoint is a CLI set
  `image: { name: ..., entrypoint: [""] }`. devbox has no entrypoint and needs no
  override.
- The clone does not belong to `sysadmin`; start the script with
  `git config --global --add safe.directory "$CI_PROJECT_DIR"` before any Git command.
- Merge request recipes use `rules: - if: $CI_PIPELINE_SOURCE == "merge_request_event"`,
  set `GIT_DEPTH: "0"`, and diff from `$CI_MERGE_REQUEST_DIFF_BASE_SHA` to `HEAD`.
- Read credentials from masked CI/CD variables and check them first with a quoted
  `': "${NAME:?Set NAME as a masked CI/CD variable}"'` line. Never put values in the file.
  Fork pipelines do not receive the parent project's variables; say so in Limitations.
- Set `timeout:` and use the lightest Ubuntu variant tag, as for GitHub Actions.

`check-repo.py` parses the file, requires a mapping, and runs `bash -n` on every job's
`script` list.
