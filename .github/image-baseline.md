# Image baseline before the catalog migration

Measured on 2026-09-25 from public `linux/amd64` Docker Hub manifests. The command read manifest metadata with `docker buildx imagetools inspect --raw`; it did not pull image layers or build images locally. Compressed byte counts exclude manifests and transport overhead.

| Published `agentimg` tag | Layers | Compressed bytes |
|---|---:|---:|
| `ubuntu-1b4689c9c8dc` | 10 | 1,048,432,470 |
| `ubuntu-055dbf6d2577` | 10 | 1,048,430,365 |
| `ubuntu` at measurement time | 10 | 1,057,227,120 |

The first pair shares 2 layers and 29,752,839 compressed bytes. A client holding the older image would need 1,018,677,526 bytes of the newer image’s layer content. The second pair shares one 32-byte layer and would need 1,057,227,088 bytes. Actual `docker pull` traffic was not measured because this review did not download layers.

Five recent successful `base-agentimg` workflow runs, visible through the [public Actions API](https://api.github.com/repos/hambn/tool-containers/actions/workflows/base-agentimg.yml/runs?per_page=5), took 10 to 17 minutes from run start to update. A Zsh-only source change currently selects all four foundation variants because `images/common/` changes are classified as shared by the retired publisher; each affected foundation digest can then select its descendants on the next scheduled check.

After publishing the new catalog, compare consecutive `runtime`, `workspace`, and agent image manifests by digest, plus the duration of the shared workflow. A Zsh-only change should select the two full workspace profiles and no agent image. Track compressed bytes absent from the older manifest alongside the build duration; labels and tag names alone do not show whether pulls reuse layers.
