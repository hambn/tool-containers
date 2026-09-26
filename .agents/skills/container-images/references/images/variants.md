# Image variants

A variant is one published profile of an image repository. Its name is the moving tag
and the bake target suffix, and it encodes `<distro>[-<tier>]`.

| Repository | Variants | `latest` |
|---|---|---|
| `core` | `alpine`, `ubuntu`, `wolfi` | `wolfi` |
| `devbox` | `alpine-lite`, `ubuntu-lite`, `alpine-full`, `ubuntu-full`, `alpine-browser`, `ubuntu-browser` | `ubuntu-full` |
| every agent | `ubuntu`, `alpine`, `ubuntu-browser`, `alpine-browser` | `ubuntu-browser` |

An agent variant without a tier suffix builds on devbox `full`; `-browser` builds on
devbox `browser`. Agents have no `lite` variant.

## Rules

- Variant names describe capability, not an interchangeable base; add a new tier or
  distro only for a demonstrated use case, and add it to the bake matrix, tests, README
  Images table, and examples together.
- Exactly one variant per repository owns `latest`, set by the `tags` script of the
  tool's workflow ([tags](../registries-and-tags.md)).
- Renaming or removing a variant is a public API change: keep the old tags frozen, note
  the deprecation in the README, and update every example that referenced it.
- Labels `io.github.hambn.containers.{tier,variant,distro}` describe each image; tests
  use the same distro, tier, and variant vocabulary ([testing](../testing.md)).
