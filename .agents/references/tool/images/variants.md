# Image variants

A variant is one buildable image profile. Its name describes the functional package
profile, not an interchangeable base image. If the base changes runtime behavior (for
example, a runtime is present versus absent), including that distinction in the name is
appropriate.

## Common profiles

| Variant | Profile | Typical base |
|---------|---------|--------------|
| `standard` | tool plus direct runtime dependencies | Debian slim |
| `minimal` | smallest useful tool image | Alpine |
| `full` | tool plus a development toolchain | Ubuntu or Debian |

One variant is required and is primary; it does not have to be named `standard`. Add
`minimal`, `full`, `gpu`, `cuda`, `ci`, or `distroless` only for a real use case.

## Naming rules

- Use lowercase names describing contents or purpose.
- Do not name variants after a base only to distinguish identical package sets.
- Treat names as stable public image tags; rename only with a migration reason.

## Tag mapping

The primary variant owns `latest` as well as its own moving `<variant>` tag. Every other
variant owns its matching moving tag. Release tags are workflow-specific and normally
belong only to the primary variant; foundation source pushes may additionally publish a
changed-variant commit tag. Do not assume every image has an immutable
`<variant>-<version>-<base-sha>` tag. CI is responsible for applying the actual mapping;
see [CI](../ci.md) and [registry/tag rules](../../repo/registries-and-tags.md).
