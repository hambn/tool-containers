# Image-project layout

The ownership boundary is `tools/<category>/<product>/`. Each product has a README, `images/` sources, and only platform examples it supports. Published profiles live in `.github/image-catalog.json`; one shared workflow publishes them.

`runtime` uses each variant directory as its build context. `workspace` uses its `images/` directory because core and full Dockerfiles bind-mount distribution scripts and full-only Zsh assets. Agent variants use their own directories as contexts. Products may depend on a published foundation or explicit agent-bundle image, but must not copy files from another product's source tree.

Use lowercase kebab-case for categories, products, profiles, and platform paths. Treat product and tag names as public registry identifiers. Update the graph, tests, docs, examples, and site when one changes. New products need a tested runtime contract and a real use case; do not create empty platform directories.
