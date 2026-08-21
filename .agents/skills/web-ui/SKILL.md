---
name: web-ui
description: Build, change, review, or troubleshoot the repository application under web-ui/, including interface architecture, components, styling, accessibility, data integration, package tooling, tests, build, deployment, and UI-specific CI. Use when the primary target is web-ui/; do not use for container deployment recipes under images/.
---

# Web UI

Own all application work under `web-ui/`. Inspect the live directory first and preserve
an implemented stack rather than replacing it without an explicit product reason.

## Bootstrap state

If the directory contains only `.gitkeep`, framework, package manager, rendering model,
design system, API contract, test runner, hosting, and deployment are undecided.

For the first scaffold:

1. Derive product behavior and technical choices from the user's request and repository
   constraints; do not invent a generic dashboard or unsupported backend.
2. Remove `.gitkeep` and keep UI source, configuration, tests, static assets, and UI docs
   inside `web-ui/`.
3. Add a short operational README. If the chosen stack has dependencies, commit its
   manifest and lockfile, ignore generated dependencies/build/cache/coverage output, and
   configure dependency automation for that actual ecosystem. Add a non-secret example
   environment contract only when the implementation has configurable values.
4. Add a dedicated `.github/workflows/web-ui*.yml` workflow, filtered for `web-ui/**`,
   that runs the validation actually supported by the chosen implementation. A static,
   no-build UI does not require a package manager, typechecker, or invented command.
5. Through `$maintain-agent-workspace`, replace this bootstrap section with the real
   stack, canonical layout, commands, data boundaries, and deployment contract. Add
   skill-local references only when the implemented application has enough detail to
   justify them.

## Product and implementation contract

- Clarify the primary user flow, content hierarchy, and interaction states before
  choosing components. Follow an existing visual system when one exists.
- Build responsive layouts with semantic controls, keyboard operation, visible focus,
  useful labels, sufficient contrast, reduced-motion support, and no color-only status.
- Define loading, empty, error, success, disabled, and long-content behavior for each
  data-driven surface. Preserve user input across recoverable failures.
- Keep secrets and privileged registry or GitHub credentials server-side. Document only
  public configuration in client environment contracts.
- Use one canonical data source and typed boundary once the stack supports it; do not
  duplicate image catalog facts manually when they can be generated or loaded safely.
- Reuse focused components for repeated behavior, but do not introduce abstraction or a
  dependency without a real repeated need.

## Verification

Run the applicable commands declared by the implemented project, never guessed commands.
For affected user-visible behavior, inspect the UI in a real browser at representative
desktop and mobile widths and cover the relevant console/network errors, keyboard and
focus behavior, overflow, and asynchronous states. For documentation or configuration
changes, use proportionate targeted checks plus repository validation.

Use `$repository-changes` for Git isolation and handoff. Load `$container-images` only
when UI packaging is implemented as a cataloged project under `images/` or changes
shared image-publication behavior; UI application rules remain owned here.
