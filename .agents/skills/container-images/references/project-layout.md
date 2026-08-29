# Image-project layout

The ownership boundary is `images/<category>/<tool>/`. `<category>` groups purpose;
`<tool>` is one independently documented and published container project; `<variant>` is
a stable public image profile.

## Standard tree

```text
tool-containers/
├── README.md
├── .github/workflows/
│   └── <category>-<tool>.yml
└── images/<category>/<tool>/
    ├── README.md
    ├── images/
    │   └── <variant>/Dockerfile
    └── examples/
        └── <platform>/
            ├── README.md
            └── runnable files
```

Every current tool owns a README, image sources, and deployment examples, but each tool
supports only the platforms present in its directory. Do not create empty platform
placeholders.

Derived variants use their own directory as build context and may not copy from outside
it. `images/base/agentimg` is the deliberate exception: its four flat
`images/*.Dockerfile` variants share distro-local scripts and common shell assets from
the tool's `images/` build context.

## Naming

- Use lowercase kebab-case category, tool, profile, and platform directory names.
- Treat tool and variant names as public registry identifiers; rename with an explicit
  compatibility and tag migration plan.
- Keep one workflow per tool at `.github/workflows/<category>-<tool>.yml`.
- Name scenario files `<scenario>.<base-name>`, for example
  `airgapped.docker-compose.yml`; keep the ordinary case at the base name.

## Adding a tool

1. Select an existing project with the closest inheritance, runtime, and deployment
   shape. Copy structure only after understanding every retained file.
2. Create its README, at least one buildable image variant, and only the deployment
   platforms that serve real use cases.
3. Add one matching publication workflow with explicit upstream/base update detection,
   primary variant, registry namespace, and immutable tag rules.
4. Add exactly one root `README.md` catalog row under the correct category. Create a new
   category only when the concrete tool does not belong to an existing one.
5. Replace every copied tool name, image path, secret, command, chart value, label, and
   source link. Compare the final file map with `git ls-files`.

Keep the project self-contained. Shared executable mechanics belong in
`.github/scripts/` only when multiple workflows genuinely use them; shared runtime
capabilities belong in a published foundation image rather than cross-directory copies.
