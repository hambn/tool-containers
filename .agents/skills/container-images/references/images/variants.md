# Image variants

A variant is one buildable functional profile. Its name is a stable public tag and
describes contents or purpose, not merely an interchangeable base distribution.

The current shared profiles are:

| Variant | Contract |
|---|---|
| `ubuntu-browser` | primary, broad Ubuntu tooling plus headless browser |
| `ubuntu` | broad Ubuntu tooling without browser payload |
| `alpine-browser` | compact Alpine tooling plus browser |
| `alpine` | compact Alpine tooling without browser payload |

This four-profile set is an actual current inheritance contract, not a universal
template for all future projects. A new project needs at least one primary variant; add
`minimal`, `full`, `gpu`, `cuda`, `ci`, `distroless`, or another profile only for a
demonstrated use case.

## Naming and compatibility

- Use lowercase kebab-case names based on functional capability.
- Include a base distinction only when it changes runtime behavior or compatibility.
- Keep one primary variant declared in CI. It owns `latest` and its own moving tag; every
  other variant owns its matching moving tag.
- Treat renames and removals as public API changes. Update inheritance, tags, platform
  examples, documentation, and migration guidance together.
- Do not assume a universal immutable version/base tag. Use the owning workflow's actual
  release mapping from [registry policy](../registries-and-tags.md).
