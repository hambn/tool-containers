# Root README

The root `README.md` is the catalog: it lists every tool and links to that tool's
directory. Detailed tool behavior belongs in the tool README.

## Required shape

1. Title and one-line repository description.
2. A pointer to [`.agents/README.md`](../../../.agents/README.md).
3. One `### <category>` subsection per category, with a table:

   | Tool | Description |
   |------|-------------|
   | [`<tool>`](../../../<category>/<tool>/) | one-line description |

## Rules

- Every tool appears exactly once in the catalog.
- Group tools by category and keep category order stable.
- Show an empty category with `_None yet._` so the catalog remains explicit.
- Adding a tool always includes its catalog row in the same change.
- Keep descriptions to one line; put details in the tool README.
