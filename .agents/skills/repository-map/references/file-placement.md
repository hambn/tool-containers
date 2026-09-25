# File placement

| Content | Canonical location |
|---|---|
| Public product links | `README.md` |
| Image product source and examples | `tools/<category>/<product>/` |
| One variant | `tools/<category>/<product>/images/<variant>/Dockerfile` |
| Shared assets within a product | Its `images/<distro>/` or `images/common/` |
| Published profile and dependency graph | `.github/image-catalog.json` |
| Shared image build and release code | `.github/scripts/image_*.py` |
| Image publisher | `.github/workflows/publish-images.yml` |
| Pull-request validation | `.github/workflows/pull-request.yml` |
| Web application | `web-ui/` |

A profile change updates its catalog entry, Dockerfile, README, examples, tests, and repository guidance together. Keep build contexts inside the owning product. Put shared CI mechanics in `.github/scripts/`, not copied publisher workflows. Do not track generated artifacts, credentials, or runtime state. Add a new category only for a concrete product.
