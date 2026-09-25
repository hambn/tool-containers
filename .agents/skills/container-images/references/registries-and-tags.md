# Registries and tags

The publisher targets `ghcr.io/<owner>/<product>` and `docker.io/<owner>/<product>`. GHCR receives a tested build first; Docker Hub receives the same staged digest before moving profile tags change. Quay is not enabled.

Every catalog profile has one explicit moving tag, such as `runtime:alpine-3.21-minimal`, `workspace:ubuntu-24.04-full`, or `codex:ubuntu-24.04`. Each successful build also has an immutable `<profile>-b<github-run-id>-<attempt>` tag. Do not publish `latest` or retired `agentimg` and four-variant aliases. Existing legacy registry artifacts stay in place but receive no updates.

For repeatable deployment, document and use a registry digest reference. Standard OCI metadata identifies source, revision, version, documentation, base, and profile; labels do not control layer reuse. Keep the release artifact with both registry digests. A tag change updates catalog, Dockerfile, examples, README, and selection tests together.
