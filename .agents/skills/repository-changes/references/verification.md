# Change verification

Choose checks based on the risk and affected domain, then always run:

```sh
bash .agents/skills/repository-changes/scripts/validate-change.sh
```

The wrapper runs the static repository validator and whitespace checks for both staged
and unstaged changes. The static validator enforces agent-workspace integrity, workflow
YAML and embedded shell, Dockerfile contracts, executable bits, Markdown links, Compose
rendering when Docker Compose is available, and Helm lint/rendering when Helm is
available. The local wrapper performs no image build or pull. Pull-request CI separately
builds and smoke-tests affected image profiles.

## Targeted checks

- **Dockerfiles:** use the correct build context and build arguments. Run a BuildKit
  syntax check or representative build when the change can affect layers or runtime.
- **Deployment:** render or lint the affected format and inspect secrets, mounts, image
  references, and offline behavior.
- **GitHub Actions:** inspect events, path filters, permissions, secrets, concurrency,
  matrix selection, shell, and publication gates.
- **Markdown and maps:** verify local links and compare claimed paths with `git ls-files`.
- **Web UI:** run the package-manager commands and browser checks selected by `$web-ui`
  once an application exists.
- **Agent skills:** run each changed helper script and the skill-creator validator when
  it is available.

After explicitly staging the intended paths, rerun the wrapper so cached whitespace is
also checked.

## Truthful reporting

Report the exact command and outcome. If Docker, Helm, network access, credentials, or
another dependency is unavailable, name the skipped check and the reason. The local static validator does not test an image at runtime. The `Pull request gate`
builds and smoke-tests affected profiles in CI, alongside metadata policy, dependency
review, and static validation. Labeling remains separate. Trivy scans and publication
happen in the shared publisher after changes reach `main`.
