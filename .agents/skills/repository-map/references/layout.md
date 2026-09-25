# Repository layout

Use `git ls-files` for the exact inventory. This map describes ownership.

- `README.md` is the public catalog.
- `.github/image-catalog.json` records published profiles, build inputs, dependencies, version sources, and smoke contracts.
- `.github/workflows/publish-images.yml` is the single daily, main-push, and manual image publisher.
- `.github/workflows/pull-request.yml` validates the repository and builds affected images without publication.
- `.github/scripts/image_*.py` plans, builds, and promotes image digests.
- `tools/base/runtime/` owns small Alpine and Ubuntu application bases.
- `tools/dev/workspace/` owns core and full interactive profiles; styled Zsh belongs only to full.
- `tools/ai/<agent>/` owns each ready-to-use agent product.
- `web-ui/` renders the root catalog and tool/example READMEs into the GitHub Pages site.
- `.agents/skills/` contains repository guidance; `AGENTS.md` is its always-loaded router.

`tools/ci/` and `tools/sandboxes/` are future categories without published products. Create one only when a concrete image and tests exist. Platform examples live in the owning product's `examples/<platform>/` directory. The site discovers categories and products from the `tools/` tree.
