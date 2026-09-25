# Image CI and publication

`.github/image-catalog.json` owns profiles, dependencies, version sources, contexts, and smoke-test kinds. `.github/scripts/image_plan.py` hashes declared files, resolved versions, external base digests, dependency fingerprints, and a weekly package-refresh epoch. Change the planner tests when selection rules change.

The single `publish-images.yml` workflow runs on relevant main pushes, daily, and by manual dispatch from main. It stages uniquely tagged GHCR images, smoke-tests them, runs vulnerability and secret scans, copies tested digests to immutable Docker Hub build tags with `skopeo copy --all --preserve-digests`, then moves profile tags. Docker Hub secrets are scoped to the promotion environment. A failed build or scan cannot move a tag. Registry failure during promotion may leave some tags moved; rerun the failed job with the retained `image-records` artifact to retry idempotently.

The pull-request gate builds affected profiles and their consumers without publishing or Docker Hub secrets. Keep third-party actions pinned, token permissions narrow, checkout credentials unpersisted, publisher concurrency non-canceling, and timeouts explicit. The publisher uses registry-backed cache per image without blanket `no-cache`. The current architecture is linux/amd64 only.

Do not add blanket vulnerability scan file exclusions. Scope any temporary exception in `.github/vulnerability-exceptions.json` to one image, CVE, reason, owner, and expiry. The scan job rejects expired entries. Published builds need SBOM and provenance. Do not publish images or dispatch workflows from a local development task without explicit authorization.
